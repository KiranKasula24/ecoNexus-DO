from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass
class ProcessorNodeInput:
    company_id: str
    locality: str
    material_category: str
    target_volume: float
    target_price: float


@dataclass
class ProcessorNodeOutput:
    status: str
    notes: str
    payload: dict[str, Any]


def run_processor_adapter_stub(data: ProcessorNodeInput) -> ProcessorNodeOutput:
    # MVP stub only. Processor-specific business logic will be plugged in later.
    return ProcessorNodeOutput(
        status="stubbed",
        notes=(
            "Processor adapter placeholder executed. Detailed processor rules are "
            "intentionally deferred for phase 2."
        ),
        payload={
            "company_id": data.company_id,
            "locality": data.locality,
            "material_category": data.material_category,
            "target_volume": data.target_volume,
            "target_price": data.target_price,
        },
    )

