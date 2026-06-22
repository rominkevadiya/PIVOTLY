from typing import Dict, Any, Union
from pydantic import ValidationError

from app.schemas.report import VentureReportV1, VentureReportV2

class UnsupportedSchemaVersionError(Exception):
    """Exception raised when an unsupported schema version is encountered."""
    pass

def validate_stored_report(report_json: Dict[str, Any], schema_version: int | None) -> Union[VentureReportV1, VentureReportV2]:
    """
    Validates a raw report JSON dictionary against the appropriate Pydantic schema based on schema_version.
    
    Args:
        report_json: The raw dictionary from the database.
        schema_version: The schema version integer from the database row.
        
    Returns:
        A validated VentureReportV1 or VentureReportV2 object.
        
    Raises:
        UnsupportedSchemaVersionError: If the schema_version is unknown.
        ValidationError: If the JSON is invalid for the target schema.
    """
    if schema_version is None or schema_version == 1:
        return VentureReportV1.model_validate(report_json)
    elif schema_version == 2:
        return VentureReportV2.model_validate(report_json)
    else:
        raise UnsupportedSchemaVersionError(f"Unsupported report schema version: {schema_version}. Please update your client.")
