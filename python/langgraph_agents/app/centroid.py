from __future__ import annotations

from dataclasses import dataclass
from math import sqrt

from .models import MarketplacePost


@dataclass(frozen=True)
class ClusterCentroid:
    centroid_id: str
    material_category: str
    avg_price: float
    avg_volume: float
    count: int


def build_centroids(posts: list[MarketplacePost]) -> list[ClusterCentroid]:
    buckets: dict[str, list[MarketplacePost]] = {}
    for post in posts:
        key = (post.material_category or "unknown").lower()
        buckets.setdefault(key, []).append(post)

    centroids: list[ClusterCentroid] = []
    for material_key in sorted(buckets.keys()):
        group = buckets[material_key]
        avg_price = sum(p.price for p in group) / len(group)
        avg_volume = sum(p.volume for p in group) / len(group)
        centroids.append(
            ClusterCentroid(
                centroid_id=f"centroid::{material_key}",
                material_category=material_key,
                avg_price=round(avg_price, 4),
                avg_volume=round(avg_volume, 4),
                count=len(group),
            )
        )
    return centroids


def choose_nearest_centroid(
    centroids: list[ClusterCentroid],
    *,
    target_price: float,
    target_volume: float,
) -> ClusterCentroid | None:
    if not centroids:
        return None

    # Normalize volume to avoid overpowering price in Euclidean distance.
    volume_scale = 10.0
    best = min(
        centroids,
        key=lambda c: (
            sqrt((c.avg_price - target_price) ** 2 + ((c.avg_volume - target_volume) / volume_scale) ** 2),
            c.centroid_id,
        ),
    )
    return best

