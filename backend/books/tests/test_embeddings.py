"""Tests for BGE-M3 embedding helper behavior."""

from django.test import SimpleTestCase

from books import embeddings


class FakeEmbeddingModel:
    def __init__(self):
        self.calls = []

    def encode(self, texts, **kwargs):
        self.calls.append({"texts": texts, "kwargs": kwargs})
        return {
            "dense_vecs": [
                [float(index)] * embeddings.BGE_M3_EMBEDDING_DIMENSIONS
                for index, _text in enumerate(texts)
            ]
        }


class EmbeddingTests(SimpleTestCase):
    def setUp(self):
        self.model = FakeEmbeddingModel()
        self.original_model = embeddings._model
        embeddings._model = self.model

    def tearDown(self):
        embeddings._model = self.original_model

    def test_get_embedding_returns_single_1024_dimension_vector(self):
        vector = embeddings.get_embedding(" hello   world ")

        self.assertEqual(len(vector), embeddings.BGE_M3_EMBEDDING_DIMENSIONS)
        self.assertEqual(vector[0], 0.0)
        self.assertEqual(self.model.calls[0]["texts"], ["hello world"])

    def test_get_embeddings_returns_one_vector_per_text(self):
        vectors = embeddings.get_embeddings(["first", "second"])

        self.assertEqual(len(vectors), 2)
        self.assertEqual(vectors[0][0], 0.0)
        self.assertEqual(vectors[1][0], 1.0)

    def test_empty_text_raises_error(self):
        with self.assertRaises(ValueError):
            embeddings.get_embedding(" \n\t ")

    def test_unexpected_dimension_raises_error(self):
        class WrongDimensionModel:
            def encode(self, texts, **kwargs):
                return {"dense_vecs": [[0.0, 1.0, 2.0]]}

        embeddings._model = WrongDimensionModel()

        with self.assertRaises(embeddings.EmbeddingError):
            embeddings.get_embedding("content")
