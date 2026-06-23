"""SkillLoader: Loads and caches agent skill files from the skills/ directory."""

import logging
from pathlib import Path

logger = logging.getLogger(__name__)

# Root directory of the skills/ folder, resolved relative to this file
_SKILLS_ROOT = Path(__file__).parent.parent / "skills"

# In-memory cache: skill_name -> markdown content
_SKILL_CACHE: dict[str, str] = {}


def load_skill(skill_name: str) -> str:
    """Load a named skill file from the skills/ directory.
    
    Skill names map directly to markdown filenames. Examples:
      load_skill("research_skill")        -> skills/research_skill.md
      load_skill("shared/citation_rules") -> skills/shared/citation_rules.md
    
    Results are cached in-memory after first load to avoid repeated disk I/O.
    
    Args:
        skill_name: Relative path to skill (without .md extension).
    
    Returns:
        The full markdown content of the skill file.
    
    Raises:
        FileNotFoundError: If the skill file does not exist on disk.
    """
    if skill_name in _SKILL_CACHE:
        return _SKILL_CACHE[skill_name]
    
    skill_path = _SKILLS_ROOT / f"{skill_name}.md"
    if not skill_path.exists():
        raise FileNotFoundError(
            f"Skill file not found: '{skill_path}'. "
            f"Available skills root: {_SKILLS_ROOT}"
        )
    
    content = skill_path.read_text(encoding="utf-8")
    _SKILL_CACHE[skill_name] = content
    logger.debug(f"Loaded skill '{skill_name}' ({len(content)} chars) from {skill_path}")
    return content


def load_shared_rules() -> str:
    """Load and concatenate all four shared rule files into a single block.
    
    Returns a single string containing citation_rules, evidence_rules,
    schema_rules, and anti_hallucination rules, ready for prompt injection.
    """
    shared_skills = [
        "shared/schema_rules",
        "shared/citation_rules",
        "shared/evidence_rules",
        "shared/anti_hallucination",
    ]
    parts = [load_skill(s) for s in shared_skills]
    return "\n\n---\n\n".join(parts)


def clear_cache() -> None:
    """Clear the in-memory skill cache. Useful for testing."""
    _SKILL_CACHE.clear()
    logger.debug("Skill cache cleared.")
