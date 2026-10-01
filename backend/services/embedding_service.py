import os

os.environ["TOKENIZERS_PARALLELISM"] = "false"

_model = None


def get_model():
    global _model

    if _model is None:
        from sentence_transformers import SentenceTransformer

        _model = SentenceTransformer(
            "all-MiniLM-L6-v2",
            device="cpu"
        )

    return _model


def create_embedding(text):
    model = get_model()
    return model.encode(text)
