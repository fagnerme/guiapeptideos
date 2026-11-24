import json
import pathlib
import unittest

from tools.gerar_api import construir
from tools.atualizar import _status_fontes


class ApiTests(unittest.TestCase):
    def test_published_snapshot_has_stable_unique_ids_and_expected_shape(self):
        path = pathlib.Path(__file__).resolve().parent.parent / "api" / "v1" / "catalog.json"
        result = json.loads(path.read_text(encoding="utf-8"))
        items = result["items"]
        ids = [item["id"] for item in items]
        self.assertEqual(result["apiVersion"], "1.0.0")
        self.assertEqual(result["access"], "public_free_read_only")
        self.assertTrue(items)
        self.assertEqual(len(ids), len(set(ids)))
        self.assertTrue(all({"id", "name", "category", "phase", "regulatory", "research"} <= item.keys() for item in items))

    def test_source_failure_keeps_last_complete_timestamp(self):
        result = _status_fontes(
            {"fontesStatus": {"clinicalTrials": {"ultimaConsultaCompletaEm": "2026-11-17T00:00:00+00:00"}}},
            ["fase2"],
            "2026-11-24T00:00:00+00:00",
        )
        self.assertEqual(result["clinicalTrials"]["status"], "parcial")
        self.assertEqual(result["clinicalTrials"]["ultimaConsultaCompletaEm"], "2026-11-17T00:00:00+00:00")
        self.assertEqual(result["clinicalTrials"]["consultasSemResposta"], ["fase2"])
        self.assertEqual(result["pubmed"]["status"], "ok")

    def test_global_anvisa_failure_does_not_mark_other_sources_failed(self):
        result = _status_fontes({}, [], "2026-11-24T00:00:00+00:00", anvisa_falhou=True)
        self.assertEqual(result["anvisa"]["status"], "falha")
        self.assertEqual(result["anvisa"]["consultasSemResposta"], ["anvisa"])
        self.assertEqual(result["fda"]["status"], "ok")

    def test_partial_source_failure_is_visible_and_old_success_date_is_preserved(self):
        live = {
            "geradoEm": "2026-11-24T13:44:15+00:00",
            "execucao": {"status": "concluida_com_falhas", "consultasSemResposta": 44},
            "itens": {
                "semaglutida": {
                    "ensaios": 10,
                    "fontesStatus": {
                        "clinicalTrials": {
                            "status": "parcial",
                            "tentadoEm": "2026-11-24T13:40:00+00:00",
                            "ultimaConsultaCompletaEm": "2026-11-17T13:40:00+00:00",
                            "consultasSemResposta": ["fase2"],
                        }
                    },
                }
            },
        }
        result = construir(live, [{"nome": "Semaglutida", "categoria": "Metabolismo", "protocolo": "omit"}],
                           [("Semaglutida", "Aprovado", "semaglutide")])
        item = result["items"][0]
        self.assertEqual(item["research"]["clinicalTrials"]["collection"]["status"], "parcial")
        self.assertEqual(item["research"]["clinicalTrials"]["collection"]["unansweredQueries"], ["fase2"])
        self.assertEqual(item["research"]["clinicalTrials"]["collection"]["lastCompleteAt"], "2026-11-17T13:40:00+00:00")
        self.assertNotIn("protocol", item)

    def test_legacy_research_metrics_are_marked_untracked(self):
        result = construir(
            {"itens": {"semaglutida": {"ensaios": 10}}},
            [{"nome": "Semaglutida", "categoria": "Metabolismo"}],
            [("Semaglutida", "Aprovado", "semaglutide")],
        )
        item = result["items"][0]
        self.assertEqual(item["research"]["clinicalTrials"]["collection"]["status"], "legacy_untracked")
        self.assertIsNone(item["research"]["clinicalTrials"]["collection"]["lastCompleteAt"])


if __name__ == "__main__":
    unittest.main()
