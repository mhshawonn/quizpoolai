"""
Optional Pinecone vector storage integration.
"""

from typing import Callable, List, Optional

from fastapi import HTTPException

from ..config import Settings
from ..logger import get_logger

try:
    from pinecone.grpc import PineconeGRPC as Pinecone
    from pinecone import ServerlessSpec
except ImportError:  # pragma: no cover - dependency optional
    Pinecone = None
    ServerlessSpec = None


class PineconeStorage:
    """Handles storing transcript embeddings in Pinecone."""

    INDEX_NAME = "youtube-transcripts"

    def __init__(self, settings: Settings):
        self.settings = settings
        self.logger = get_logger(self.__class__.__name__)
        self.client = self._init_client()

    def _init_client(self):
        if not Pinecone:
            self.logger.info("Pinecone SDK not installed; skipping vector storage.")
            return None
        if not self.settings.pinecone_api_key:
            self.logger.info("PINECONE_API_KEY not set; skipping vector storage.")
            return None
        try:
            return Pinecone(api_key=self.settings.pinecone_api_key)
        except Exception as error:
            self.logger.warning("Pinecone initialization failed: %s", error)
            return None

    def store_transcript(
        self, transcript: str, video_id: str, embed_fn: Callable[[str], List[float]]
    ) -> None:
        if not self.client:
            return

        try:
            if not self.client.has_index(self.INDEX_NAME):
                self.client.create_index(
                    name=self.INDEX_NAME,
                    dimension=768,
                    metric="cosine",
                    spec=ServerlessSpec(cloud="aws", region="us-east-1"),
                    deletion_protection="disabled",
                )
                self.logger.info("Created Pinecone index %s", self.INDEX_NAME)

            index = self.client.Index(self.INDEX_NAME)
            chunks = self._chunk_text(transcript)
            vectors = []
            for idx, chunk in enumerate(chunks):
                embedding = embed_fn(chunk)
                if embedding:
                    vectors.append(
                        {
                            "id": f"{video_id}_{idx}",
                            "values": embedding,
                            "metadata": {"text": chunk, "video_id": video_id},
                        }
                    )
            if vectors:
                index.upsert(vectors=vectors)
                self.logger.info(
                    "Stored %d transcript chunks for video %s",
                    len(vectors),
                    video_id,
                )
        except Exception as error:
            self.logger.warning("Pinecone storage failed: %s", error)

    def _chunk_text(self, text: str, chunk_size: int = 1000, step: int = 800):
        return [text[i : i + chunk_size] for i in range(0, len(text), step)]
