from app.centroid import build_centroids, choose_nearest_centroid
from app.models import MarketplacePost


def test_choose_nearest_centroid_prefers_closest_price_volume() -> None:
    posts = [
        MarketplacePost(
            material_category="ferrous-metals",
            material_subtype="a",
            price=200,
            volume=100,
            locality="hyderabad",
        ),
        MarketplacePost(
            material_category="ferrous-metals",
            material_subtype="b",
            price=220,
            volume=120,
            locality="hyderabad",
        ),
        MarketplacePost(
            material_category="polymers",
            material_subtype="pet",
            price=140,
            volume=60,
            locality="hyderabad",
        ),
    ]
    centroids = build_centroids(posts)
    nearest = choose_nearest_centroid(centroids, target_price=214, target_volume=115)
    assert nearest is not None
    assert nearest.material_category == "ferrous-metals"
    assert nearest.centroid_id == "centroid::ferrous-metals"

