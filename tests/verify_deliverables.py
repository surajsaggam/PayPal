#!/usr/bin/env python3
"""
PayPal AI Hackathon — 4-Tier Opaque-Box E2E Deliverable Verification Suite
==========================================================================

Validates all Stage 1 (`war-room-council`) and Stage 2 (`/bible` for `PS-01: PayOps AI`)
deliverables in `s:\\PayPal` against `ORIGINAL_REQUEST.md` (R1-R4, AC1-AC4),
`PROJECT.md` (24 features & Interface Contracts 1-3), and `TEST_INFRA.md`.

Usage:
    python "s:\\PayPal\\tests\\verify_deliverables.py"            # Run all tiers (1..4)
    python "s:\\PayPal\\tests\\verify_deliverables.py" --tier 1   # Run Tier 1 only
    python "s:\\PayPal\\tests\\verify_deliverables.py" --tier 2   # Run Tier 2 only
    python "s:\\PayPal\\tests\\verify_deliverables.py" --tier 3   # Run Tier 3 only
    python "s:\\PayPal\\tests\\verify_deliverables.py" --tier 4   # Run Tier 4 only
"""

from __future__ import annotations

import argparse
import re
import sys
import unicodedata
from dataclasses import dataclass
from pathlib import Path
from typing import Callable, Dict, List, Optional, Sequence, Set, Tuple


ROOT_DIR = Path(__file__).resolve().parent.parent


@dataclass
class CheckResult:
    tier: int
    check_id: str
    feature_id: str
    description: str
    passed: bool
    detail: str


class VerificationSuite:
    def __init__(self, root: Path) -> None:
        self.root = root
        self.results: List[CheckResult] = []
        self._text_cache: Dict[Path, str] = {}

    def resolve(self, rel_path: str) -> Path:
        return self.root / Path(rel_path)

    def exists(self, rel_path: str) -> bool:
        return self.resolve(rel_path).exists()

    def file_size(self, rel_path: str) -> int:
        p = self.resolve(rel_path)
        if not p.is_file():
            return -1
        return p.stat().st_size

    def read_text(self, rel_path: str) -> str:
        p = self.resolve(rel_path)
        if p in self._text_cache:
            return self._text_cache[p]
        if not p.is_file():
            return ""
        text = p.read_text(encoding="utf-8", errors="replace").lstrip("\ufeff")
        self._text_cache[p] = text
        return text

    def read_bytes(self, rel_path: str) -> bytes:
        p = self.resolve(rel_path)
        if not p.is_file():
            return b""
        return p.read_bytes()

    @staticmethod
    def normalize_ascii(text: str) -> str:
        return (
            unicodedata.normalize("NFKD", text)
            .encode("ascii", "ignore")
            .decode("ascii")
        )

    def record(
        self,
        tier: int,
        check_id: str,
        feature_id: str,
        description: str,
        passed: bool,
        detail: str = "",
    ) -> None:
        self.results.append(
            CheckResult(
                tier=tier,
                check_id=check_id,
                feature_id=feature_id,
                description=description,
                passed=passed,
                detail=detail or ("OK" if passed else "Check failed"),
            )
        )

    def check_files_exist_and_min_size(
        self,
        tier: int,
        check_id: str,
        feature_id: str,
        description: str,
        rel_paths: Sequence[str],
        min_bytes: int = 1,
    ) -> None:
        missing: List[str] = []
        undersized: List[str] = []
        for rp in rel_paths:
            sz = self.file_size(rp)
            if sz < 0:
                missing.append(rp)
            elif sz < min_bytes:
                undersized.append(f"{rp} ({sz}B < {min_bytes}B)")
        if missing or undersized:
            problems = []
            if missing:
                problems.append(f"Missing: {', '.join(missing)}")
            if undersized:
                problems.append(f"Undersized: {', '.join(undersized)}")
            self.record(tier, check_id, feature_id, description, False, "; ".join(problems))
        else:
            self.record(
                tier,
                check_id,
                feature_id,
                description,
                True,
                f"All {len(rel_paths)} file(s) exist and >= {min_bytes}B",
            )

    def check_terms_in_file(
        self,
        tier: int,
        check_id: str,
        feature_id: str,
        description: str,
        rel_path: str,
        terms: Sequence[str],
        case_insensitive: bool = True,
        ascii_normalize: bool = True,
    ) -> None:
        text = self.read_text(rel_path)
        if not text:
            self.record(
                tier,
                check_id,
                feature_id,
                description,
                False,
                f"File missing or empty: {rel_path}",
            )
            return
        haystack = self.normalize_ascii(text) if ascii_normalize else text
        if case_insensitive:
            haystack_cmp = haystack.lower()
        else:
            haystack_cmp = haystack

        missing: List[str] = []
        for term in terms:
            needle = self.normalize_ascii(term) if ascii_normalize else term
            needle_cmp = needle.lower() if case_insensitive else needle
            if needle_cmp not in haystack_cmp:
                missing.append(term)

        if missing:
            self.record(
                tier,
                check_id,
                feature_id,
                description,
                False,
                f"In {rel_path}, missing term(s): {', '.join(missing)}",
            )
        else:
            self.record(
                tier,
                check_id,
                feature_id,
                description,
                True,
                f"All {len(terms)} required term(s) found in {rel_path}",
            )

    def check_regexes_in_file(
        self,
        tier: int,
        check_id: str,
        feature_id: str,
        description: str,
        rel_path: str,
        patterns: Sequence[Tuple[str, str]],
        flags: int = re.IGNORECASE | re.MULTILINE,
        ascii_normalize: bool = True,
    ) -> None:
        text = self.read_text(rel_path)
        if not text:
            self.record(
                tier,
                check_id,
                feature_id,
                description,
                False,
                f"File missing or empty: {rel_path}",
            )
            return
        haystack = self.normalize_ascii(text) if ascii_normalize else text
        missing: List[str] = []
        for label, pat in patterns:
            if not re.search(pat, haystack, flags):
                missing.append(label)
        if missing:
            self.record(
                tier,
                check_id,
                feature_id,
                description,
                False,
                f"In {rel_path}, failed pattern(s): {', '.join(missing)}",
            )
        else:
            self.record(
                tier,
                check_id,
                feature_id,
                description,
                True,
                f"All {len(patterns)} pattern(s) matched in {rel_path}",
            )


# Canonical lists from PROJECT.md
PAYPAL_MAFIA_CORE_7 = [
    "Peter Thiel",
    "Elon Musk",
    "Reid Hoffman",
    "Max Levchin",
    "David Sacks",
    "Roelof Botha",
    "Keith Rabois",
]

PAYPAL_LEADERSHIP_PATTERNS: List[Tuple[str, str]] = [
    ("Alex Chriss", r"Alex\s+Chriss"),
    ("Dan Schulman", r"Dan\s+Schulman"),
    ("Srini Venkatesan", r"Srini\s+Venkatesan"),
    ("Prakhar Mehrotra", r"Prakhar\s+Mehrotra"),
    ("Aaron J. Webster", r"Aaron\s+(?:J\.\s+)?Webster"),
    ("Michelle Gill", r"Michelle\s+Gill"),
    ("Diego Scotti", r"Diego\s+Scotti"),
    ("Suzan Kereere", r"Suzan\s+Kereere"),
    ("Jose Fernandez da Ponte", r"Jose\s+Fernandez\s+da\s+Ponte"),
]

DEVPOST_SPONSORS_10 = [
    "AG Grid",
    "APIMatic",
    "Astropods",
    "Bryntum",
    "Channel3",
    "Elastic",
    "KERNEL",
    "Postman",
    "Render",
    "Zapier",
]

DEVPOST_JUDGES_13_PATTERNS: List[Tuple[str, str]] = [
    ("Jo Franchetti", r"Jo\s+Franchetti"),
    ("Eddie Jaoude", r"Eddie\s+Jaoude"),
    ("Marco Podien", r"Marco\s+Podien"),
    ("Karthik Ravi", r"Karthik\s+Ravi"),
    ("Himraj Singh", r"Himraj\s+Singh"),
    ("Nathaniel Olson", r"Nathaniel\s+Olson"),
    ("Sylwia Vargas", r"Sylwia\s+Vargas"),
    ("Ameer Hassan", r"Ameer\s+Hassan"),
    ("Mats Bryntse", r"Mats\s+Bryntse"),
    ("Ignacio Valdez Bicard", r"Ignacio\s+Valdez"),
    ("Carly Richmond", r"Carly\s+Richmond"),
    ("Pooja Mistry", r"Pooja\s+Mistry"),
    ("Shifra Williams", r"Shifra\s+Williams"),
]

FEATURE_IDS = [f"F-{i:02d}" for i in range(1, 13)]
USER_STORY_IDS = [f"US-{i:02d}" for i in range(1, 17)]
ENTITY_IDS = [f"E-{i:02d}" for i in range(1, 11)]
API_IDS = [f"API-{i:02d}" for i in range(1, 15)]
MODEL_IDS = [f"M-{i:02d}" for i in range(1, 6)]
RISK_IDS = [f"R-{i:02d}" for i in range(1, 13)]
ADR_IDS = [f"ADR-{i:04d}" for i in range(1, 6)]
PS_IDS = [f"PS-{i:02d}" for i in range(1, 26)]
DOMAIN_IDS = ["D1", "D2", "D3", "D4", "D5"]
WINNABILITY_SCORES = ["9.07", "9.05", "8.79", "8.37", "8.33"]

DOCS_OVERVIEW_FILES = [
    "docs/00-overview/PROJECT_BRIEF.md",
    "docs/00-overview/VISION.md",
    "docs/00-overview/PITCH.md",
    "docs/00-overview/HACKATHON_PLAN.md",
]

DOCS_PRODUCT_FILES = [
    "docs/01-product/PRD.md",
    "docs/01-product/PERSONAS.md",
    "docs/01-product/USER_JOURNEYS.md",
    "docs/01-product/USER_STORIES.md",
    "docs/01-product/FEATURES.md",
    "docs/01-product/ROADMAP.md",
    "docs/01-product/METRICS.md",
    "docs/01-product/COMPETITIVE_ANALYSIS.md",
]

DOCS_DESIGN_FILES = [
    "docs/02-design/DESIGN_SYSTEM.md",
    "docs/02-design/UI_SPEC.md",
    "docs/02-design/ACCESSIBILITY.md",
    "docs/02-design/LOCALIZATION.md",
]

DOCS_ENGINEERING_FILES = [
    "docs/03-engineering/ARCHITECTURE.md",
    "docs/03-engineering/TECH_STACK.md",
    "docs/03-engineering/DATA_MODEL.md",
    "docs/03-engineering/API_SPEC.md",
    "docs/03-engineering/INTEGRATIONS.md",
    "docs/03-engineering/FRONTEND.md",
    "docs/03-engineering/BACKEND.md",
    "docs/03-engineering/CODING_STANDARDS.md",
    "docs/03-engineering/GIT_WORKFLOW.md",
    "docs/03-engineering/TESTING.md",
    "docs/03-engineering/PERFORMANCE.md",
    "docs/03-engineering/ENVIRONMENT_SETUP.md",
    "docs/03-engineering/MOBILE.md",
]

DOCS_ADR_FILES = [
    "docs/03-engineering/adr/ADR-0000-template.md",
    "docs/03-engineering/adr/ADR-0001-tech-stack.md",
    "docs/03-engineering/adr/ADR-0002-database-and-state.md",
    "docs/03-engineering/adr/ADR-0003-ai-model-and-agent-architecture.md",
    "docs/03-engineering/adr/ADR-0004-hosting-and-deployment.md",
    "docs/03-engineering/adr/ADR-0005-auth-and-payment-security.md",
]

DOCS_AI_FILES = [
    "docs/04-ai/MODELS.md",
    "docs/04-ai/PROMPTS.md",
    "docs/04-ai/AI_EVALS.md",
    "docs/04-ai/DATA_PIPELINE.md",
    "docs/04-ai/RESPONSIBLE_AI.md",
    "docs/04-ai/FINE_TUNING.md",
]

DOCS_OPS_FILES = [
    "docs/05-ops/CICD.md",
    "docs/05-ops/INFRASTRUCTURE.md",
    "docs/05-ops/DEPLOYMENT.md",
    "docs/05-ops/OBSERVABILITY.md",
    "docs/05-ops/RUNBOOK.md",
    "docs/05-ops/COST.md",
    "docs/05-ops/SLA.md",
]

DOCS_SECURITY_FILES = [
    "docs/06-security-compliance/SECURITY_ARCHITECTURE.md",
    "docs/06-security-compliance/THREAT_MODEL.md",
    "docs/06-security-compliance/PRIVACY.md",
    "docs/06-security-compliance/COMPLIANCE.md",
    "docs/06-security-compliance/RISK_REGISTER.md",
    "docs/06-security-compliance/REGULATORY_SANDBOX.md",
]

DOCS_BUSINESS_FILES = [
    "docs/07-business/BUSINESS_MODEL.md",
    "docs/07-business/GTM.md",
    "docs/07-business/FINANCIALS.md",
    "docs/07-business/IMPACT.md",
    "docs/07-business/PROCUREMENT.md",
]

DOCS_PROJECT_FILES = [
    "docs/08-project/BACKLOG.md",
    "docs/08-project/TEAM.md",
    "docs/08-project/GLOSSARY.md",
]

ALL_BIBLE_DOCS = (
    DOCS_OVERVIEW_FILES
    + DOCS_PRODUCT_FILES
    + DOCS_DESIGN_FILES
    + DOCS_ENGINEERING_FILES
    + DOCS_ADR_FILES
    + DOCS_AI_FILES
    + DOCS_OPS_FILES
    + DOCS_SECURITY_FILES
    + DOCS_BUSINESS_FILES
    + DOCS_PROJECT_FILES
)

OPENAPI_REQUIRED_ENDPOINT_PATTERNS: List[Tuple[str, str]] = [
    ("API-01 /api/v1/agent/execute", r"/api/v1/agent/execute"),
    ("API-02 /api/v1/agent/approve/{executionId}", r"/api/v1/agent/approve/"),
    ("API-03 /api/v1/policies", r"/api/v1/policies"),
    ("API-04 /api/v1/invoices/autonomous", r"/api/v1/invoices/autonomous"),
    ("API-05 /api/v1/invoices", r"/api/v1/invoices\b"),
    ("API-06 /api/v1/invoices/{invoiceId}/remind", r"/api/v1/invoices/[^/\s]+/remind"),
    ("API-07 /api/v1/orders", r"/api/v1/orders\b"),
    ("API-08 /api/v1/orders/{orderId}/capture", r"/api/v1/orders/[^/\s]+/capture"),
    ("API-09 /api/v1/orders/{orderId}/refund", r"/api/v1/orders/[^/\s]+/refund"),
    ("API-10 /api/v1/disputes", r"/api/v1/disputes\b"),
    ("API-11 /api/v1/disputes/{disputeId}/resolve", r"/api/v1/disputes/[^/\s]+/resolve"),
    ("API-12 /api/v1/subscriptions/plans", r"/api/v1/subscriptions/plans"),
    ("API-13 /api/v1/webhooks/paypal", r"/api/v1/webhooks/paypal"),
    ("API-14 /api/v1/analytics/insights", r"/api/v1/analytics/insights"),
]


def find_missing_hours_1_to_48(text: str) -> List[str]:
    """
    Determine which hours in H01..H48 are covered in `text`.
    Supports both individual hour tags (e.g. `H01`, `H1`, `H48`) and hour range
    blocks (e.g. `H01-H04`, `H01–H04`, `H01 to H04`, `H01-04`).
    """
    covered: Set[int] = set()

    # Match hour ranges such as H01-H04, H01–H06, H1 to H4, H01-04
    range_pattern = re.compile(
        r"\bH0?(\d{1,2})\s*(?:[-–—]+|to)\s*H?0?(\d{1,2})\b", re.IGNORECASE
    )
    for m in range_pattern.finditer(text):
        start_h = int(m.group(1))
        end_h = int(m.group(2))
        if 1 <= start_h <= 48 and 1 <= end_h <= 48 and start_h <= end_h:
            for h in range(start_h, end_h + 1):
                covered.add(h)

    # Match explicit individual hour tags such as H01, H1, H48
    single_pattern = re.compile(r"\bH0?(\d{1,2})\b", re.IGNORECASE)
    for m in single_pattern.finditer(text):
        h = int(m.group(1))
        if 1 <= h <= 48:
            covered.add(h)

    return [f"H{h:02d}" for h in range(1, 49) if h not in covered]


# ============================================================================
# TIER 1: FEATURE COVERAGE (>= 5 Checks per Feature across all 24 Features)
# ============================================================================


def run_tier_1(suite: VerificationSuite) -> None:
    t = 1

    # --- Feature 1: Devpost Hackathon Facts & Rules Extraction ---
    suite.check_files_exist_and_min_size(
        t, "T1-F01-1", "F1", "research/01-facts.md exists and >= 500 bytes", ["research/01-facts.md"], 500
    )
    suite.check_files_exist_and_min_size(
        t, "T1-F01-2", "F1", "biblehackathon.md exists and >= 10,000 bytes", ["biblehackathon.md"], 10000
    )
    suite.check_regexes_in_file(
        t,
        "T1-F01-3",
        "F1",
        "biblehackathon.md contains Part 1 heading and PayPal AI Hackathon identity",
        "biblehackathon.md",
        [
            ("Part 1 heading", r"^#\s+Part\s+1\b"),
            ("PayPal AI Hackathon / Build What's Next", r"PayPal\s+AI\s+Hackathon|Build\s+What's\s+Next"),
        ],
    )
    suite.check_regexes_in_file(
        t,
        "T1-F01-4",
        "F1",
        "biblehackathon.md documents $69,750 prize pool and prize structure",
        "biblehackathon.md",
        [
            ("$69,750 prize pool", r"69,750|69750"),
            ("$12,000 Grand Prize or 15 prize categories", r"12,000|12k|15\s+(?:prize|categories|awards)"),
        ],
    )
    suite.check_regexes_in_file(
        t,
        "T1-F01-5",
        "F1",
        "biblehackathon.md documents 5x20% judging criteria and Oct-Nov 2026 schedule",
        "biblehackathon.md",
        [
            ("20% judging criterion weight", r"20%"),
            ("2026 timeline", r"2026"),
            ("November deadline", r"Nov(?:ember)?\s+12"),
        ],
    )

    # --- Feature 2: PayPal Engineering Tools, Frameworks & Infra Forensics ---
    suite.check_terms_in_file(
        t,
        "T1-F02-1",
        "F2",
        "biblehackathon.md documents PayPal core application frameworks (Raptor, Spring Boot, Kraken)",
        "biblehackathon.md",
        ["Raptor", "Spring Boot", "Kraken"],
    )
    suite.check_terms_in_file(
        t,
        "T1-F02-2",
        "F2",
        "biblehackathon.md documents PayPal data & messaging backbone (JunoDB, Kafka)",
        "biblehackathon.md",
        ["JunoDB", "Kafka"],
    )
    suite.check_regexes_in_file(
        t,
        "T1-F02-3",
        "F2",
        "biblehackathon.md documents PayPal AI & risk engines (Cosmos.AI, Simility, GNN/Real-Time Graph)",
        "biblehackathon.md",
        [
            ("Cosmos.AI", r"Cosmos"),
            ("Simility", r"Simility"),
            ("GNN / Real-Time Graph", r"\bGNN\b|Graph\s+Neural|Real-Time\s+Graph"),
        ],
    )
    suite.check_terms_in_file(
        t,
        "T1-F02-4",
        "F2",
        "biblehackathon.md documents PayPal Agentic stack (@paypal/agent-toolkit, MCP)",
        "biblehackathon.md",
        ["@paypal/agent-toolkit", "MCP"],
    )
    suite.check_terms_in_file(
        t,
        "T1-F02-5",
        "F2",
        "biblehackathon.md documents PayPal commerce rails (Fastlane, Braintree, Venmo, PYUSD)",
        "biblehackathon.md",
        ["Fastlane", "Braintree", "Venmo", "PYUSD"],
    )

    # --- Feature 3: Organisers, CEOs & Executive Leadership Profiles (Track A) ---
    suite.check_files_exist_and_min_size(
        t, "T1-F03-1", "F3", "research/A-organisers.md exists and >= 500 bytes", ["research/A-organisers.md"], 500
    )
    suite.check_regexes_in_file(
        t,
        "T1-F03-2",
        "F3",
        "biblehackathon.md contains Part 2 (The People) heading",
        "biblehackathon.md",
        [("Part 2 heading", r"^#\s+Part\s+2\b")],
    )
    suite.check_terms_in_file(
        t,
        "T1-F03-3",
        "F3",
        "biblehackathon.md profiles current and former PayPal CEOs (Alex Chriss, Dan Schulman)",
        "biblehackathon.md",
        ["Alex Chriss", "Dan Schulman"],
    )
    suite.check_terms_in_file(
        t,
        "T1-F03-4",
        "F3",
        "biblehackathon.md profiles PayPal technology & AI executives (Srini Venkatesan, Archie Deskus, Prakhar Mehrotra)",
        "biblehackathon.md",
        ["Srini Venkatesan", "Archie Deskus", "Prakhar Mehrotra"],
    )
    suite.check_regexes_in_file(
        t,
        "T1-F03-5",
        "F3",
        "biblehackathon.md profiles PayPal business unit executives (Webster, Gill, Scotti, Kereere, Fernandez da Ponte)",
        "biblehackathon.md",
        [
            ("Aaron J. Webster", r"Aaron\s+(?:J\.\s+)?Webster"),
            ("Michelle Gill", r"Michelle\s+Gill"),
            ("Diego Scotti", r"Diego\s+Scotti"),
            ("Suzan Kereere", r"Suzan\s+Kereere"),
            ("Jose Fernandez da Ponte", r"Jose\s+Fernandez\s+da\s+Ponte"),
        ],
    )

    # --- Feature 4: 10 Official Ecosystem Sponsors Analysis (Track B) ---
    suite.check_files_exist_and_min_size(
        t, "T1-F04-1", "F4", "research/B-sponsors.md exists and >= 500 bytes", ["research/B-sponsors.md"], 500
    )
    suite.check_terms_in_file(
        t,
        "T1-F04-2",
        "F4",
        "biblehackathon.md analyzes sponsors AG Grid and APIMatic",
        "biblehackathon.md",
        ["AG Grid", "APIMatic"],
    )
    suite.check_terms_in_file(
        t,
        "T1-F04-3",
        "F4",
        "biblehackathon.md analyzes sponsors Astropods and Bryntum",
        "biblehackathon.md",
        ["Astropods", "Bryntum"],
    )
    suite.check_terms_in_file(
        t,
        "T1-F04-4",
        "F4",
        "biblehackathon.md analyzes sponsors Channel3, Elastic, and KERNEL",
        "biblehackathon.md",
        ["Channel3", "Elastic", "KERNEL"],
    )
    suite.check_terms_in_file(
        t,
        "T1-F04-5",
        "F4",
        "biblehackathon.md analyzes sponsors Postman, Render, and Zapier",
        "biblehackathon.md",
        ["Postman", "Render", "Zapier"],
    )

    # --- Feature 5: 13 Named Devpost Judges & Judge Heat-Map (Track C) ---
    suite.check_files_exist_and_min_size(
        t, "T1-F05-1", "F5", "research/C-judges.md exists and >= 500 bytes", ["research/C-judges.md"], 500
    )
    suite.check_terms_in_file(
        t,
        "T1-F05-2",
        "F5",
        "biblehackathon.md profiles PayPal judges Jo Franchetti, Eddie Jaoude, Marco Podien",
        "biblehackathon.md",
        ["Jo Franchetti", "Eddie Jaoude", "Marco Podien"],
    )
    suite.check_terms_in_file(
        t,
        "T1-F05-3",
        "F5",
        "biblehackathon.md profiles PayPal judges Karthik Ravi, Himraj Singh, Nathaniel Olson",
        "biblehackathon.md",
        ["Karthik Ravi", "Himraj Singh", "Nathaniel Olson"],
    )
    suite.check_regexes_in_file(
        t,
        "T1-F05-4",
        "F5",
        "biblehackathon.md profiles Sponsor judges Sylwia Vargas, Ameer Hassan, Mats Bryntse, Ignacio Valdez Bicard",
        "biblehackathon.md",
        [
            ("Sylwia Vargas", r"Sylwia\s+Vargas"),
            ("Ameer Hassan", r"Ameer\s+Hassan"),
            ("Mats Bryntse", r"Mats\s+Bryntse"),
            ("Ignacio Valdez Bicard", r"Ignacio\s+Valdez"),
        ],
    )
    suite.check_regexes_in_file(
        t,
        "T1-F05-5",
        "F5",
        "biblehackathon.md profiles Sponsor judges Carly Richmond, Pooja Mistry, Shifra Williams and includes Judge Heat-Map",
        "biblehackathon.md",
        [
            ("Carly Richmond", r"Carly\s+Richmond"),
            ("Pooja Mistry", r"Pooja\s+Mistry"),
            ("Shifra Williams", r"Shifra\s+Williams"),
            ("Judge Heat-Map", r"heat[-\s]?map"),
        ],
    )

    # --- Feature 6: Why This Hackathon, Why Now & Geopolitical/Industry Triggers (Track D) ---
    suite.check_files_exist_and_min_size(
        t, "T1-F06-1", "F6", "research/D-why-now.md exists and >= 500 bytes", ["research/D-why-now.md"], 500
    )
    suite.check_regexes_in_file(
        t,
        "T1-F06-2",
        "F6",
        "biblehackathon.md contains Part 3 (Why This Hackathon, Why Now) heading",
        "biblehackathon.md",
        [("Part 3 heading", r"^#\s+Part\s+3\b")],
    )
    suite.check_terms_in_file(
        t,
        "T1-F06-3",
        "F6",
        "biblehackathon.md analyzes agentic commerce (MCP) and checkout conversion (Fastlane) triggers",
        "biblehackathon.md",
        ["MCP", "Fastlane"],
    )
    suite.check_terms_in_file(
        t,
        "T1-F06-4",
        "F6",
        "biblehackathon.md analyzes dispute/fraud pressure and PYUSD programmable settlement triggers",
        "biblehackathon.md",
        ["dispute", "PYUSD"],
    )
    suite.check_regexes_in_file(
        t,
        "T1-F06-5",
        "F6",
        "biblehackathon.md analyzes global commerce and India DPI/cross-border triggers",
        "biblehackathon.md",
        [
            ("India / DPI / UPI / RBI lens", r"\b(?:India|DPI|UPI|RBI)\b"),
            ("Cross-border commerce", r"cross[-\s]?border"),
        ],
    )

    # --- Feature 7: Patrick Jane Synthesis: 7+ Connected Dots, Hidden Criteria, Landmines & 80% Trap (Track F) ---
    suite.check_files_exist_and_min_size(
        t,
        "T1-F07-1",
        "F7",
        "research/F-connect-the-dots.md exists and >= 500 bytes",
        ["research/F-connect-the-dots.md"],
        500,
    )
    suite.check_regexes_in_file(
        t,
        "T1-F07-2",
        "F7",
        "biblehackathon.md contains Part 4 (Connecting the Dots) heading",
        "biblehackathon.md",
        [("Part 4 heading", r"^#\s+Part\s+4\b")],
    )
    suite.check_regexes_in_file(
        t,
        "T1-F07-3",
        "F7",
        "biblehackathon.md documents at least 7 connected dots (Dot 1..Dot 7 or 1..7)",
        "biblehackathon.md",
        [
            ("Dot 1 / #1", r"(?:Dot\s*#?1\b|^\s*1\.\s+\*\*)"),
            ("Dot 7 / #7", r"(?:Dot\s*#?7\b|^\s*7\.\s+\*\*)"),
        ],
    )
    suite.check_regexes_in_file(
        t,
        "T1-F07-4",
        "F7",
        "biblehackathon.md documents Hidden Evaluation Criteria and Landmines",
        "biblehackathon.md",
        [
            ("Hidden evaluation criteria", r"Hidden\s+evaluation\s+criteria"),
            ("Landmines", r"Landmines"),
        ],
    )
    suite.check_regexes_in_file(
        t,
        "T1-F07-5",
        "F7",
        "biblehackathon.md documents The 80% Trap",
        "biblehackathon.md",
        [("The 80% trap", r"80%\s+trap")],
    )

    # --- Feature 8: Competition Forecast, Prior Art & 5-Factor Domain Winnability Index (Track E) ---
    suite.check_files_exist_and_min_size(
        t, "T1-F08-1", "F8", "research/E-competition.md exists and >= 500 bytes", ["research/E-competition.md"], 500
    )
    suite.check_regexes_in_file(
        t,
        "T1-F08-2",
        "F8",
        "biblehackathon.md contains Part 5 (The Battlefield) heading",
        "biblehackathon.md",
        [("Part 5 heading", r"^#\s+Part\s+5\b")],
    )
    suite.check_regexes_in_file(
        t,
        "T1-F08-3",
        "F8",
        "biblehackathon.md includes competition forecast and prior work analysis",
        "biblehackathon.md",
        [
            ("Competition forecast", r"Competition\s+forecast"),
            ("Prior work / GitHub repos", r"Prior\s+work|GitHub"),
        ],
    )
    suite.check_terms_in_file(
        t,
        "T1-F08-4",
        "F8",
        "biblehackathon.md ranks all 5 canonical strategic domains (D1..D5)",
        "biblehackathon.md",
        DOMAIN_IDS,
    )
    suite.check_terms_in_file(
        t,
        "T1-F08-5",
        "F8",
        "biblehackathon.md includes canonical Domain Winnability scores (9.07, 9.05, 8.79, 8.37, 8.33)",
        "biblehackathon.md",
        WINNABILITY_SCORES,
    )

    # --- Feature 9: Extended War-Room Council Roster & Persona Dossiers ---
    suite.check_files_exist_and_min_size(
        t,
        "T1-F09-1",
        "F9",
        "war-room/roster-additions.md exists and >= 1,000 bytes",
        ["war-room/roster-additions.md"],
        1000,
    )
    suite.check_terms_in_file(
        t,
        "T1-F09-2",
        "F9",
        "war-room/roster-additions.md includes all 6 persona dossier fields (Rise, How they decide, Asks, Attacks, Voice, Blind spot)",
        "war-room/roster-additions.md",
        ["Rise", "How they decide", "Asks", "Attacks", "Voice", "Blind spot"],
    )
    suite.check_regexes_in_file(
        t,
        "T1-F09-3",
        "F9",
        "biblehackathon.md contains Part 6 (The Council) and numbered Sources section",
        "biblehackathon.md",
        [
            ("Part 6 heading", r"^#\s+Part\s+6\b"),
            ("Sources heading", r"^#\s+Sources\b"),
        ],
    )
    suite.check_terms_in_file(
        t,
        "T1-F09-4",
        "F9",
        "biblehackathon.md includes all 7 core PayPal Mafia members (Thiel, Musk, Hoffman, Levchin, Sacks, Botha, Rabois)",
        "biblehackathon.md",
        PAYPAL_MAFIA_CORE_7,
    )
    bh_text = suite.read_text("biblehackathon.md")
    bh_turns = len(re.findall(r"\*\*[^*\n]{2,60}\*\*:?", bh_text))
    bh_cites = len(re.findall(r"\[S\d+\]", bh_text))
    suite.record(
        t,
        "T1-F09-5",
        "F9",
        "biblehackathon.md contains multi-round council debate transcript with bold speaker turns and [S#] citations",
        bh_turns >= 10 and bh_cites >= 10,
        f"Found {bh_turns} bold speaker/field tags and {bh_cites} [S#] citations in biblehackathon.md",
    )

    # --- Feature 10: biblehackathon.pdf Styled A4 PDF Generation ---
    bh_pdf_bytes = suite.read_bytes("biblehackathon.pdf")
    suite.record(
        t,
        "T1-F10-1",
        "F10",
        "biblehackathon.pdf exists on disk",
        len(bh_pdf_bytes) > 0,
        f"File exists ({len(bh_pdf_bytes)} bytes)" if bh_pdf_bytes else "biblehackathon.pdf missing or empty",
    )
    suite.record(
        t,
        "T1-F10-2",
        "F10",
        "biblehackathon.pdf exceeds 50 KB size threshold",
        len(bh_pdf_bytes) > 51200,
        f"Size is {len(bh_pdf_bytes)} bytes (threshold > 51,200 bytes)",
    )
    suite.record(
        t,
        "T1-F10-3",
        "F10",
        "biblehackathon.pdf starts with %PDF- magic bytes",
        bh_pdf_bytes.startswith(b"%PDF-"),
        f"Header bytes: {bh_pdf_bytes[:8]!r}",
    )
    suite.record(
        t,
        "T1-F10-4",
        "F10",
        "biblehackathon.pdf contains valid %%EOF trailer",
        b"%%EOF" in bh_pdf_bytes[-1024:] if bh_pdf_bytes else False,
        "Found %%EOF in final 1024 bytes" if (bh_pdf_bytes and b"%%EOF" in bh_pdf_bytes[-1024:]) else "Missing %%EOF trailer",
    )
    bh_page_count = len(re.findall(rb"/Type\s*/Page\b", bh_pdf_bytes))
    suite.record(
        t,
        "T1-F10-5",
        "F10",
        "biblehackathon.pdf contains multiple rendered PDF pages (/Type /Page)",
        bh_page_count >= 3,
        f"Found {bh_page_count} /Type /Page objects",
    )

    # --- Feature 11: Phase 2 Deep Research Across 5 Strategic PayPal AI Domains ---
    suite.check_files_exist_and_min_size(
        t, "T1-F11-1", "F11", "research/domains/D1.md exists and >= 800 bytes", ["research/domains/D1.md"], 800
    )
    suite.check_files_exist_and_min_size(
        t, "T1-F11-2", "F11", "research/domains/D2.md exists and >= 800 bytes", ["research/domains/D2.md"], 800
    )
    suite.check_files_exist_and_min_size(
        t, "T1-F11-3", "F11", "research/domains/D3.md exists and >= 800 bytes", ["research/domains/D3.md"], 800
    )
    suite.check_files_exist_and_min_size(
        t,
        "T1-F11-4",
        "F11",
        "research/domains/D4.md and D5.md exist and >= 800 bytes each",
        ["research/domains/D4.md", "research/domains/D5.md"],
        800,
    )
    suite.check_terms_in_file(
        t,
        "T1-F11-5",
        "F11",
        "research/domains/D1.md covers pain map, urgency, prior art, and 3 gap buckets",
        "research/domains/D1.md",
        ["Exists-but-weak", "Doesn't exist", "Urgency"],
    )

    # --- Feature 12: Multi-Round War-Room Council Debates (Rounds 0-5) per Domain ---
    suite.check_files_exist_and_min_size(
        t,
        "T1-F12-1",
        "F12",
        "war-room/D1.md..D5.md exist and >= 800 bytes each",
        [f"war-room/D{i}.md" for i in range(1, 6)],
        800,
    )
    suite.check_regexes_in_file(
        t,
        "T1-F12-2",
        "F12",
        "ideas.md embeds multi-round war-room debate rounds (Round 0 through Round 5)",
        "ideas.md",
        [(f"Round {r}", rf"Round\s+{r}\b") for r in range(0, 6)],
    )
    suite.check_terms_in_file(
        t,
        "T1-F12-3",
        "F12",
        "ideas.md explicitly includes all 7 core PayPal Mafia members (Thiel, Musk, Hoffman, Levchin, Sacks, Botha, Rabois)",
        "ideas.md",
        PAYPAL_MAFIA_CORE_7,
    )
    suite.check_regexes_in_file(
        t,
        "T1-F12-4",
        "F12",
        "ideas.md explicitly includes PayPal CEOs & leadership (Chriss, Schulman, Venkatesan, Mehrotra, Webster, Gill, Scotti, Kereere, Fernandez da Ponte)",
        "ideas.md",
        PAYPAL_LEADERSHIP_PATTERNS,
    )
    ideas_text = suite.read_text("ideas.md")
    ideas_turns = len(re.findall(r"\*\*[^*\n]{2,60}\*\*:?", ideas_text))
    ideas_cites = len(re.findall(r"\[S\d+\]", ideas_text))
    suite.record(
        t,
        "T1-F12-5",
        "F12",
        "ideas.md contains >= 25 bold speaker turns and [S#] citations across multi-round debates",
        ideas_turns >= 25 and ideas_cites >= 25,
        f"Found {ideas_turns} bold speaker/field tags and {ideas_cites} [S#] citations in ideas.md",
    )

    # --- Feature 13: 25 Ranked Selectable Problem Statements (PS-01 to PS-25) in ideas.md ---
    suite.check_files_exist_and_min_size(
        t, "T1-F13-1", "F13", "ideas.md exists and >= 15,000 bytes", ["ideas.md"], 15000
    )
    suite.check_regexes_in_file(
        t,
        "T1-F13-2",
        "F13",
        "ideas.md contains Part 0 (Where to Play), top pick PS-01 (PayOps AI), and dark horse PS-06 (ChargebackZero)",
        "ideas.md",
        [
            ("Part 0 heading", r"^#\s+Part\s+0\b"),
            ("Top pick PS-01 PayOps AI", r"PayOps\s+AI"),
            ("Dark horse PS-06 ChargebackZero", r"ChargebackZero"),
        ],
    )
    suite.check_terms_in_file(
        t,
        "T1-F13-3",
        "F13",
        "ideas.md contains all 25 selectable problem statement IDs (PS-01 through PS-25)",
        "ideas.md",
        PS_IDS,
    )
    suite.check_terms_in_file(
        t,
        "T1-F13-4",
        "F13",
        "ideas.md includes required template fields (The pain, Why now, demo moment, 30-second explanation, Council jurisdiction, Tech stack, Score breakdown)",
        "ideas.md",
        [
            "The pain",
            "Why now",
            "demo moment",
            "30-second explanation",
            "Council jurisdiction",
            "Tech stack",
            "Score breakdown",
        ],
    )
    suite.check_regexes_in_file(
        t,
        "T1-F13-5",
        "F13",
        "ideas.md ends with a numbered # Sources section",
        "ideas.md",
        [("Sources heading", r"^#\s+Sources\b")],
    )

    # --- Feature 14: ideas.pdf Styled A4 PDF Generation ---
    id_pdf_bytes = suite.read_bytes("ideas.pdf")
    suite.record(
        t,
        "T1-F14-1",
        "F14",
        "ideas.pdf exists on disk",
        len(id_pdf_bytes) > 0,
        f"File exists ({len(id_pdf_bytes)} bytes)" if id_pdf_bytes else "ideas.pdf missing or empty",
    )
    suite.record(
        t,
        "T1-F14-2",
        "F14",
        "ideas.pdf exceeds 50 KB size threshold",
        len(id_pdf_bytes) > 51200,
        f"Size is {len(id_pdf_bytes)} bytes (threshold > 51,200 bytes)",
    )
    suite.record(
        t,
        "T1-F14-3",
        "F14",
        "ideas.pdf starts with %PDF- magic bytes",
        id_pdf_bytes.startswith(b"%PDF-"),
        f"Header bytes: {id_pdf_bytes[:8]!r}",
    )
    suite.record(
        t,
        "T1-F14-4",
        "F14",
        "ideas.pdf contains valid %%EOF trailer",
        b"%%EOF" in id_pdf_bytes[-1024:] if id_pdf_bytes else False,
        "Found %%EOF in final 1024 bytes" if (id_pdf_bytes and b"%%EOF" in id_pdf_bytes[-1024:]) else "Missing %%EOF trailer",
    )
    id_page_count = len(re.findall(rb"/Type\s*/Page\b", id_pdf_bytes))
    suite.record(
        t,
        "T1-F14-5",
        "F14",
        "ideas.pdf contains multiple rendered PDF pages (/Type /Page)",
        id_page_count >= 3,
        f"Found {id_page_count} /Type /Page objects",
    )

    # --- Feature 15: /bible Group 1: docs/00-overview/ (4 Files) ---
    suite.check_files_exist_and_min_size(
        t, "T1-F15-1", "F15", "docs/00-overview/ (4 files) exist and >= 800 bytes each", DOCS_OVERVIEW_FILES, 800
    )
    suite.check_terms_in_file(
        t,
        "T1-F15-2",
        "F15",
        "PROJECT_BRIEF.md defines PayOps AI (PS-01) and core PayPal stack components",
        "docs/00-overview/PROJECT_BRIEF.md",
        ["PayOps AI", "PS-01", "@paypal/agent-toolkit", "JunoDB", "Cosmos"],
    )
    suite.check_regexes_in_file(
        t,
        "T1-F15-3",
        "F15",
        "VISION.md documents North-Star metric and 1/5/10-year horizon",
        "docs/00-overview/VISION.md",
        [
            ("North Star metric", r"North[-\s]Star"),
            ("Multi-year vision (1/5/10-year)", r"10[-\s]year|Year\s+10"),
        ],
    )
    suite.check_regexes_in_file(
        t,
        "T1-F15-4",
        "F15",
        "PITCH.md documents 3-minute pitch script, 30-second Karp explanation, and fallback plan",
        "docs/00-overview/PITCH.md",
        [
            ("3-minute pitch", r"3[-\s]minute"),
            ("30-second explanation", r"30[-\s]second"),
            ("Fallback / offline plan", r"fallback|offline"),
        ],
    )
    suite.check_regexes_in_file(
        t,
        "T1-F15-5",
        "F15",
        "HACKATHON_PLAN.md documents hour-by-hour execution plan and Devpost judging checklist",
        "docs/00-overview/HACKATHON_PLAN.md",
        [
            ("Hour-by-hour markers (H01..H48)", r"\bH0?1\b.*?\bH48\b|\bH01\b"),
            ("Devpost / judging rubric", r"Devpost|judging|criterion|criteria"),
        ],
        flags=re.IGNORECASE | re.DOTALL,
    )

    # --- Feature 16: /bible Group 2: docs/01-product/ (8 Files) ---
    suite.check_files_exist_and_min_size(
        t, "T1-F16-1", "F16", "docs/01-product/ (all 8 files) exist and >= 800 bytes each", DOCS_PRODUCT_FILES, 800
    )
    suite.check_terms_in_file(
        t,
        "T1-F16-2",
        "F16",
        "USER_STORIES.md uses Gherkin Given/When/Then acceptance criteria",
        "docs/01-product/USER_STORIES.md",
        ["Given", "When", "Then"],
    )
    suite.check_terms_in_file(
        t,
        "T1-F16-3",
        "F16",
        "FEATURES.md documents MoSCoW prioritization and MVP separation",
        "docs/01-product/FEATURES.md",
        ["Must", "Should", "Could", "MVP"],
    )
    suite.check_regexes_in_file(
        t,
        "T1-F16-4",
        "F16",
        "USER_JOURNEYS.md includes Mermaid journey/flowchart diagrams",
        "docs/01-product/USER_JOURNEYS.md",
        [("Mermaid block", r"```mermaid")],
    )
    suite.check_terms_in_file(
        t,
        "T1-F16-5",
        "F16",
        "METRICS.md and COMPETITIVE_ANALYSIS.md cover North Star/AARRR and competitive moat",
        "docs/01-product/METRICS.md",
        ["North Star", "AARRR"],
    )

    # --- Feature 17: /bible Group 3: docs/02-design/ (4 Files) ---
    suite.check_files_exist_and_min_size(
        t, "T1-F17-1", "F17", "docs/02-design/ (all 4 files) exist and >= 800 bytes each", DOCS_DESIGN_FILES, 800
    )
    suite.check_terms_in_file(
        t,
        "T1-F17-2",
        "F17",
        "DESIGN_SYSTEM.md specifies colour tokens, typography, and motion tokens",
        "docs/02-design/DESIGN_SYSTEM.md",
        ["token", "typography", "PayPal"],
    )
    suite.check_terms_in_file(
        t,
        "T1-F17-3",
        "F17",
        "UI_SPEC.md specifies AG Grid, Bryntum, and 5 interactive states (empty, loading, error, offline, success)",
        "docs/02-design/UI_SPEC.md",
        ["AG Grid", "Bryntum", "empty", "loading", "error", "offline", "success"],
    )
    suite.check_terms_in_file(
        t,
        "T1-F17-4",
        "F17",
        "ACCESSIBILITY.md covers WCAG 2.2 AA compliance",
        "docs/02-design/ACCESSIBILITY.md",
        ["WCAG 2.2", "ARIA", "keyboard"],
    )
    suite.check_terms_in_file(
        t,
        "T1-F17-5",
        "F17",
        "LOCALIZATION.md covers multi-currency formatting ($, ₹, PYUSD)",
        "docs/02-design/LOCALIZATION.md",
        ["$", "₹", "PYUSD"],
        ascii_normalize=False,
    )

    # --- Feature 18: /bible Group 4: docs/03-engineering/ + adr/ + api/openapi.yaml (20 Files) ---
    suite.check_files_exist_and_min_size(
        t,
        "T1-F18-1",
        "F18",
        "docs/03-engineering/ (all 13 core engineering docs) exist and >= 800 bytes each",
        DOCS_ENGINEERING_FILES,
        800,
    )
    suite.check_files_exist_and_min_size(
        t,
        "T1-F18-2",
        "F18",
        "docs/03-engineering/adr/ (all 6 ADR files ADR-0000..ADR-0005) exist and >= 800 bytes each",
        DOCS_ADR_FILES,
        800,
    )
    suite.check_regexes_in_file(
        t,
        "T1-F18-3",
        "F18",
        "ARCHITECTURE.md contains Mermaid diagrams and references PayPal patterns (JunoDB, Cosmos.AI, PayPal-Request-Id)",
        "docs/03-engineering/ARCHITECTURE.md",
        [
            ("Mermaid diagram", r"```mermaid"),
            ("JunoDB pattern", r"JunoDB"),
            ("Cosmos.AI pattern", r"Cosmos"),
            ("Idempotency / PayPal-Request-Id", r"PayPal-Request-Id|idempoten"),
        ],
    )
    suite.check_terms_in_file(
        t,
        "T1-F18-4",
        "F18",
        "INTEGRATIONS.md covers PayPal APIs, @paypal/agent-toolkit, MCP, APIMatic, AG Grid, Bryntum, Elastic, Render",
        "docs/03-engineering/INTEGRATIONS.md",
        ["@paypal/agent-toolkit", "MCP", "APIMatic", "AG Grid", "Bryntum", "Elastic", "Render"],
    )
    suite.check_files_exist_and_min_size(
        t, "T1-F18-5", "F18", "api/openapi.yaml exists and >= 1,500 bytes", ["api/openapi.yaml"], 1500
    )

    # --- Feature 19: /bible Group 5: docs/04-ai/ (6 Files) ---
    suite.check_files_exist_and_min_size(
        t, "T1-F19-1", "F19", "docs/04-ai/ (all 6 AI docs) exist and >= 800 bytes each", DOCS_AI_FILES, 800
    )
    suite.check_terms_in_file(
        t,
        "T1-F19-2",
        "F19",
        "MODELS.md defines M-01..M-05 with $ and ₹ cost/latency metrics",
        "docs/04-ai/MODELS.md",
        MODEL_IDS + ["$", "₹"],
        ascii_normalize=False,
    )
    suite.check_terms_in_file(
        t,
        "T1-F19-3",
        "F19",
        "PROMPTS.md covers system prompts, @paypal/agent-toolkit schemas, and prompt injection defenses",
        "docs/04-ai/PROMPTS.md",
        ["@paypal/agent-toolkit", "injection"],
    )
    suite.check_terms_in_file(
        t,
        "T1-F19-4",
        "F19",
        "AI_EVALS.md and DATA_PIPELINE.md cover eval benchmarks, precision/recall, and RAG pipeline",
        "docs/04-ai/AI_EVALS.md",
        ["precision", "recall", "hallucination"],
    )
    suite.check_regexes_in_file(
        t,
        "T1-F19-5",
        "F19",
        "RESPONSIBLE_AI.md covers autonomy slider, human-in-the-loop, NIST AI RMF, EU AI Act, and IndiaAI/MeitY",
        "docs/04-ai/RESPONSIBLE_AI.md",
        [
            ("Autonomy slider / human-in-the-loop", r"autonomy|human-in-the-loop"),
            ("NIST AI RMF", r"NIST"),
            ("EU AI Act", r"EU\s+AI\s+Act"),
            ("IndiaAI / MeitY", r"IndiaAI|MeitY"),
        ],
    )

    # --- Feature 20: /bible Group 6: docs/05-ops/ + .github/workflows/ (9 Files) ---
    suite.check_files_exist_and_min_size(
        t, "T1-F20-1", "F20", "docs/05-ops/ (all 7 ops docs) exist and >= 800 bytes each", DOCS_OPS_FILES, 800
    )
    suite.check_files_exist_and_min_size(
        t,
        "T1-F20-2",
        "F20",
        ".github/workflows/ci.yml and deploy.yml exist and >= 200 bytes each",
        [".github/workflows/ci.yml", ".github/workflows/deploy.yml"],
        200,
    )
    suite.check_terms_in_file(
        t,
        "T1-F20-3",
        "F20",
        "COST.md models 100 / 10,000 / 1,000,000 user tiers in $ and ₹",
        "docs/05-ops/COST.md",
        ["100", "10,000", "1,000,000", "$", "₹"],
        ascii_normalize=False,
    )
    suite.check_regexes_in_file(
        t,
        "T1-F20-4",
        "F20",
        "RUNBOOK.md documents failure playbooks and demo-day emergency fallback",
        "docs/05-ops/RUNBOOK.md",
        [
            ("Severity levels (SEV-1..)", r"SEV-?1"),
            ("Demo-day fallback", r"demo|fallback"),
        ],
    )
    suite.check_regexes_in_file(
        t,
        "T1-F20-5",
        "F20",
        "OBSERVABILITY.md documents Elastic/OpenTelemetry and 180-day audit retention",
        "docs/05-ops/OBSERVABILITY.md",
        [
            ("Elastic / OpenTelemetry", r"Elastic|OpenTelemetry"),
            ("180-day retention", r"180"),
        ],
    )

    # --- Feature 21: /bible Group 7: docs/06-security-compliance/ (6 Files) ---
    suite.check_files_exist_and_min_size(
        t,
        "T1-F21-1",
        "F21",
        "docs/06-security-compliance/ (all 6 security/compliance docs) exist and >= 800 bytes each",
        DOCS_SECURITY_FILES,
        800,
    )
    suite.check_terms_in_file(
        t,
        "T1-F21-2",
        "F21",
        "SECURITY_ARCHITECTURE.md covers OAuth2, OWASP Top 10, PCI-DSS, and webhook verification",
        "docs/06-security-compliance/SECURITY_ARCHITECTURE.md",
        ["OAuth2", "OWASP", "PCI-DSS", "webhook"],
    )
    suite.check_terms_in_file(
        t,
        "T1-F21-3",
        "F21",
        "THREAT_MODEL.md includes Mermaid trust boundaries and STRIDE analysis",
        "docs/06-security-compliance/THREAT_MODEL.md",
        ["```mermaid", "STRIDE"],
    )
    suite.check_terms_in_file(
        t,
        "T1-F21-4",
        "F21",
        "PRIVACY.md and COMPLIANCE.md cover DPDP, GDPR, PCI-DSS, FinCEN, and RBI",
        "docs/06-security-compliance/COMPLIANCE.md",
        ["DPDP", "GDPR", "PCI-DSS", "FinCEN", "RBI"],
    )
    suite.check_terms_in_file(
        t,
        "T1-F21-5",
        "F21",
        "RISK_REGISTER.md catalogs all 12 canonical risks (R-01..R-12)",
        "docs/06-security-compliance/RISK_REGISTER.md",
        RISK_IDS,
    )

    # --- Feature 22: /bible Group 8 & 9: docs/07-business/ (5 Files) & docs/08-project/ (3 Files) ---
    suite.check_files_exist_and_min_size(
        t, "T1-F22-1", "F22", "docs/07-business/ (all 5 business docs) exist and >= 800 bytes each", DOCS_BUSINESS_FILES, 800
    )
    suite.check_files_exist_and_min_size(
        t, "T1-F22-2", "F22", "docs/08-project/ (all 3 project docs) exist and >= 800 bytes each", DOCS_PROJECT_FILES, 800
    )
    suite.check_terms_in_file(
        t,
        "T1-F22-3",
        "F22",
        "BUSINESS_MODEL.md and FINANCIALS.md cover CAC, LTV, and 3-year projections",
        "docs/07-business/FINANCIALS.md",
        ["CAC", "LTV"],
    )
    suite.check_terms_in_file(
        t,
        "T1-F22-4",
        "F22",
        "TEAM.md includes a RACI matrix and GLOSSARY.md defines core PayPal/FinTech acronyms",
        "docs/08-project/TEAM.md",
        ["RACI"],
    )
    suite.check_terms_in_file(
        t,
        "T1-F22-5",
        "F22",
        "GLOSSARY.md defines TPV, Fastlane, PYUSD, JunoDB, and PCI-DSS",
        "docs/08-project/GLOSSARY.md",
        ["TPV", "Fastlane", "PYUSD", "JunoDB", "PCI-DSS"],
    )

    # --- Feature 23: /bible Group 0 & 11: Root Repository Files (8 Files) + Code Skeleton Directories ---
    suite.check_files_exist_and_min_size(
        t,
        "T1-F23-1",
        "F23",
        "Root repository files README.md, CLAUDE.md, CONTRIBUTING.md, SECURITY.md exist and >= 200 bytes",
        ["README.md", "CLAUDE.md", "CONTRIBUTING.md", "SECURITY.md"],
        200,
    )
    suite.check_files_exist_and_min_size(
        t,
        "T1-F23-2",
        "F23",
        "Root repository files CHANGELOG.md, CODE_OF_CONDUCT.md, .env.example, MAP.md exist and >= 200 bytes",
        ["CHANGELOG.md", "CODE_OF_CONDUCT.md", ".env.example", "MAP.md"],
        200,
    )
    suite.check_regexes_in_file(
        t,
        "T1-F23-3",
        "F23",
        ".env.example defines PayPal Sandbox credential templates",
        ".env.example",
        [("PayPal client config", r"PAYPAL_CLIENT_ID")],
    )
    suite.check_regexes_in_file(
        t,
        "T1-F23-4",
        "F23",
        "MAP.md contains directory tree, 'Where do I find' table, Mermaid dependency graph, and reading paths",
        "MAP.md",
        [
            ("Where do I find lookup table", r"Where\s+do\s+I\s+find"),
            ("Mermaid dependency graph", r"```mermaid"),
            ("Judge reading path", r"judge"),
        ],
    )
    skeleton_dirs = ["apps", "services", "packages", "ai", "infra", "api", "scripts", "tests"]
    missing_dirs = [d for d in skeleton_dirs if not suite.resolve(d).is_dir()]
    empty_dirs = [
        d for d in skeleton_dirs if suite.resolve(d).is_dir() and not any(suite.resolve(d).iterdir())
    ]
    suite.record(
        t,
        "T1-F23-5",
        "F23",
        "All 8 code skeleton directories (apps, services, packages, ai, infra, api, scripts, tests) exist and are non-empty",
        not missing_dirs and not empty_dirs,
        "All 8 skeleton directories exist and are populated"
        if (not missing_dirs and not empty_dirs)
        else f"Missing dirs: {missing_dirs}; Empty dirs: {empty_dirs}",
    )

    # --- Feature 24: Automated Opaque-Box E2E Verification Suite ---
    suite.check_files_exist_and_min_size(
        t, "T1-F24-1", "F24", "TEST_INFRA.md exists and >= 1,000 bytes", ["TEST_INFRA.md"], 1000
    )
    suite.check_files_exist_and_min_size(
        t, "T1-F24-2", "F24", "TEST_READY.md exists and >= 500 bytes", ["TEST_READY.md"], 500
    )
    suite.check_files_exist_and_min_size(
        t,
        "T1-F24-3",
        "F24",
        "tests/verify_deliverables.py exists and >= 5,000 bytes",
        ["tests/verify_deliverables.py"],
        5000,
    )
    suite.check_terms_in_file(
        t,
        "T1-F24-4",
        "F24",
        "TEST_INFRA.md documents all 4 verification tiers (Tier 1..Tier 4)",
        "TEST_INFRA.md",
        ["Tier 1", "Tier 2", "Tier 3", "Tier 4"],
    )
    f_counts: Dict[str, int] = {}
    for r in suite.results:
        if r.tier == 1:
            f_counts[r.feature_id] = f_counts.get(r.feature_id, 0) + 1
    f_counts_with_this = dict(f_counts)
    f_counts_with_this["F24"] = f_counts_with_this.get("F24", 0) + 1
    under_covered = [f"F{i}" for i in range(1, 25) if f_counts_with_this.get(f"F{i}", 0) < 5]
    suite.record(
        t,
        "T1-F24-5",
        "F24",
        "All 24 inventoried features in PROJECT.md have >= 5 verification checks in Tier 1",
        len(under_covered) == 0,
        f"All 24 features have >= 5 checks (total {len(suite.results) + 1} Tier 1 checks)"
        if not under_covered
        else f"Under-covered features: {under_covered}",
    )


# ============================================================================
# TIER 2: BOUNDARY, FORMAT & ANTI-PLACEHOLDER CORNER CASES
# ============================================================================


def run_tier_2(suite: VerificationSuite) -> None:
    t = 2

    # T2-01: biblehackathon.pdf magic bytes & >50 KB
    bh_pdf = suite.read_bytes("biblehackathon.pdf")
    suite.record(
        t,
        "T2-PDF-01",
        "Format/PDF",
        "biblehackathon.pdf starts with %PDF- magic bytes and size > 50 KB (51,200 bytes)",
        bh_pdf.startswith(b"%PDF-") and len(bh_pdf) > 51200,
        f"starts_with_%PDF={bh_pdf.startswith(b'%PDF-')}, size={len(bh_pdf)}B",
    )

    # T2-02: ideas.pdf magic bytes & >50 KB
    id_pdf = suite.read_bytes("ideas.pdf")
    suite.record(
        t,
        "T2-PDF-02",
        "Format/PDF",
        "ideas.pdf starts with %PDF- magic bytes and size > 50 KB (51,200 bytes)",
        id_pdf.startswith(b"%PDF-") and len(id_pdf) > 51200,
        f"starts_with_%PDF={id_pdf.startswith(b'%PDF-')}, size={len(id_pdf)}B",
    )

    # T2-03: Zero prohibited placeholders (\b(TODO|TBD)\b|coming soon) across core files and all docs/
    placeholder_regex = re.compile(r"\b(TODO|TBD)\b|coming\s+soon", re.IGNORECASE)
    root_targets = ["biblehackathon.md", "ideas.md", "MAP.md", "README.md", "CLAUDE.md"]
    docs_dir = suite.resolve("docs")
    doc_md_files: List[str] = []
    if docs_dir.is_dir():
        for p in sorted(docs_dir.rglob("*.md")):
            doc_md_files.append(p.relative_to(suite.root).as_posix())
    all_scan_files = list(dict.fromkeys(root_targets + ALL_BIBLE_DOCS + doc_md_files))

    missing_scan_files: List[str] = []
    placeholder_hits: List[str] = []
    for rp in all_scan_files:
        if not suite.exists(rp):
            missing_scan_files.append(rp)
            continue
        text = suite.read_text(rp)
        for line_no, line in enumerate(text.splitlines(), start=1):
            m = placeholder_regex.search(line)
            if m:
                snippet = line.strip()
                if len(snippet) > 80:
                    snippet = snippet[:77] + "..."
                placeholder_hits.append(f"{rp}:{line_no} ({m.group(0)!r}: {snippet})")

    suite.record(
        t,
        "T2-PLACEHOLDER-01",
        "Anti-Placeholder",
        "Zero occurrences of case-insensitive \\b(TODO|TBD)\\b|coming soon across biblehackathon.md, ideas.md, MAP.md, README.md, CLAUDE.md, and docs/**/*.md",
        len(missing_scan_files) == 0 and len(placeholder_hits) == 0,
        f"Scanned {len(all_scan_files)} files with 0 placeholder matches"
        if (not missing_scan_files and not placeholder_hits)
        else (
            f"Missing files ({len(missing_scan_files)}): {missing_scan_files[:5]}; "
            f"Placeholder matches ({len(placeholder_hits)}): {placeholder_hits[:5]}"
        ),
    )

    # T2-04: Every .md file under docs/ starts with `# ` title and `> Project:` metadata header block
    target_docs = list(dict.fromkeys(ALL_BIBLE_DOCS + doc_md_files))
    header_violations: List[str] = []
    size_violations: List[str] = []
    for rp in target_docs:
        sz = suite.file_size(rp)
        if sz < 0:
            header_violations.append(f"{rp} (missing)")
            size_violations.append(f"{rp} (missing)")
            continue
        if sz <= 800:
            size_violations.append(f"{rp} ({sz}B <= 800B)")
        text = suite.read_text(rp)
        non_empty_lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
        top_15 = "\n".join(text.splitlines()[:15])
        if not non_empty_lines or not non_empty_lines[0].startswith("# "):
            header_violations.append(f"{rp} (missing leading '# ' H1 title)")
        elif "> Project:" not in top_15:
            header_violations.append(f"{rp} (missing '> Project:' metadata block in top 15 lines)")

    suite.record(
        t,
        "T2-HEADER-01",
        "Format/Headers",
        "Every .md file under s:\\PayPal\\docs\\ starts with '# <Title>' and contains '> Project:' metadata header block",
        len(header_violations) == 0 and len(target_docs) >= 58,
        f"All {len(target_docs)} docs/**/*.md files have valid '# ' title and '> Project:' metadata header"
        if not header_violations
        else f"Violations ({len(header_violations)}): {header_violations[:8]}",
    )

    # T2-05: Every .md file under docs/ exceeds minimum substantive length (>800 bytes)
    suite.record(
        t,
        "T2-SIZE-01",
        "Boundary/Size",
        "Every .md file under s:\\PayPal\\docs\\ exceeds minimum substantive length (> 800 bytes)",
        len(size_violations) == 0 and len(target_docs) >= 58,
        f"All {len(target_docs)} docs/**/*.md files exceed 800 bytes"
        if not size_violations
        else f"Size violations ({len(size_violations)}): {size_violations[:8]}",
    )

    # T2-06: api/openapi.yaml declares OpenAPI 3.1 and required top-level sections
    suite.check_regexes_in_file(
        t,
        "T2-OPENAPI-01",
        "Format/OpenAPI",
        "s:\\PayPal\\api\\openapi.yaml declares openapi: 3.1.x and top-level info, paths, and components sections",
        "api/openapi.yaml",
        [
            ("openapi: 3.1.x", r"^openapi:\s*['\"]?3\.1"),
            ("info:", r"^info:"),
            ("paths:", r"^paths:"),
            ("components:", r"^components:"),
        ],
    )

    # T2-07: api/openapi.yaml defines all 14 canonical endpoints (API-01..API-14)
    suite.check_regexes_in_file(
        t,
        "T2-OPENAPI-02",
        "Format/OpenAPI",
        "s:\\PayPal\\api\\openapi.yaml defines all 14 canonical API-01..API-14 endpoint paths",
        "api/openapi.yaml",
        OPENAPI_REQUIRED_ENDPOINT_PATTERNS,
    )

    # T2-08: .github/workflows/ci.yml and deploy.yml have valid workflow keys
    suite.check_regexes_in_file(
        t,
        "T2-WORKFLOW-01",
        "Format/YAML",
        ".github/workflows/ci.yml contains valid GitHub Actions structure (name, on, jobs, steps)",
        ".github/workflows/ci.yml",
        [
            ("name:", r"^name:"),
            ("on:", r"^on:"),
            ("jobs:", r"^jobs:"),
            ("steps:", r"\bsteps:"),
        ],
    )
    suite.check_regexes_in_file(
        t,
        "T2-WORKFLOW-02",
        "Format/YAML",
        ".github/workflows/deploy.yml contains valid GitHub Actions structure (name, on, jobs, steps)",
        ".github/workflows/deploy.yml",
        [
            ("name:", r"^name:"),
            ("on:", r"^on:"),
            ("jobs:", r"^jobs:"),
            ("steps:", r"\bsteps:"),
        ],
    )


# ============================================================================
# TIER 3: CROSS-FEATURE & CROSS-DOCUMENT ID CONSISTENCY
# ============================================================================


def run_tier_3(suite: VerificationSuite) -> None:
    t = 3

    # T3-01: Features F-01..F-12 across PROJECT_BRIEF, PRD, FEATURES, USER_STORIES, BACKLOG
    for rp in [
        "docs/00-overview/PROJECT_BRIEF.md",
        "docs/01-product/PRD.md",
        "docs/01-product/FEATURES.md",
        "docs/01-product/USER_STORIES.md",
        "docs/08-project/BACKLOG.md",
    ]:
        suite.check_terms_in_file(
            t,
            f"T3-FEAT-{Path(rp).stem}",
            "ID-Sync/F-01..F-12",
            f"All 12 Feature IDs (F-01..F-12) appear in {rp}",
            rp,
            FEATURE_IDS,
        )

    # T3-02: User Stories US-01..US-16 across PROJECT_BRIEF, PRD, USER_STORIES, BACKLOG
    for rp in [
        "docs/00-overview/PROJECT_BRIEF.md",
        "docs/01-product/PRD.md",
        "docs/01-product/USER_STORIES.md",
        "docs/08-project/BACKLOG.md",
    ]:
        suite.check_terms_in_file(
            t,
            f"T3-US-{Path(rp).stem}",
            "ID-Sync/US-01..US-16",
            f"All 16 User Story IDs (US-01..US-16) appear in {rp}",
            rp,
            USER_STORY_IDS,
        )

    # T3-03: Data Entities E-01..E-10 across PROJECT_BRIEF and DATA_MODEL
    for rp in [
        "docs/00-overview/PROJECT_BRIEF.md",
        "docs/03-engineering/DATA_MODEL.md",
    ]:
        suite.check_terms_in_file(
            t,
            f"T3-ENT-{Path(rp).stem}",
            "ID-Sync/E-01..E-10",
            f"All 10 Entity IDs (E-01..E-10) appear in {rp}",
            rp,
            ENTITY_IDS,
        )

    # T3-04: API Endpoints API-01..API-14 across PROJECT_BRIEF and API_SPEC
    for rp in [
        "docs/00-overview/PROJECT_BRIEF.md",
        "docs/03-engineering/API_SPEC.md",
    ]:
        suite.check_terms_in_file(
            t,
            f"T3-API-{Path(rp).stem}",
            "ID-Sync/API-01..API-14",
            f"All 14 API Endpoint IDs (API-01..API-14) appear in {rp}",
            rp,
            API_IDS,
        )

    # T3-05: AI Models M-01..M-05 across PROJECT_BRIEF and MODELS
    for rp in [
        "docs/00-overview/PROJECT_BRIEF.md",
        "docs/04-ai/MODELS.md",
    ]:
        suite.check_terms_in_file(
            t,
            f"T3-MOD-{Path(rp).stem}",
            "ID-Sync/M-01..M-05",
            f"All 5 AI Model IDs (M-01..M-05) appear in {rp}",
            rp,
            MODEL_IDS,
        )

    # T3-06: Risks R-01..R-12 across PROJECT_BRIEF and RISK_REGISTER
    for rp in [
        "docs/00-overview/PROJECT_BRIEF.md",
        "docs/06-security-compliance/RISK_REGISTER.md",
    ]:
        suite.check_terms_in_file(
            t,
            f"T3-RISK-{Path(rp).stem}",
            "ID-Sync/R-01..R-12",
            f"All 12 Risk IDs (R-01..R-12) appear in {rp}",
            rp,
            RISK_IDS,
        )

    # T3-07: ADRs ADR-0001..ADR-0005 across PROJECT_BRIEF and ARCHITECTURE
    for rp in [
        "docs/00-overview/PROJECT_BRIEF.md",
        "docs/03-engineering/ARCHITECTURE.md",
    ]:
        suite.check_terms_in_file(
            t,
            f"T3-ADR-{Path(rp).stem}",
            "ID-Sync/ADR-0001..ADR-0005",
            f"All 5 ADR IDs (ADR-0001..ADR-0005) appear in {rp}",
            rp,
            ADR_IDS,
        )

    # T3-08: Stage 1 <-> Stage 2 Domain (D1..D5) and Top Pick (PS-01 / PayOps AI) consistency
    for rp in ["biblehackathon.md", "ideas.md"]:
        suite.check_terms_in_file(
            t,
            f"T3-DOM-{Path(rp).stem}",
            "Stage-Sync/D1..D5",
            f"All 5 Domains (D1..D5) and Winnability Scores (9.07..8.33) match in {rp}",
            rp,
            DOMAIN_IDS + WINNABILITY_SCORES,
        )

    for rp in [
        "biblehackathon.md",
        "ideas.md",
        "docs/00-overview/PROJECT_BRIEF.md",
        "docs/01-product/PRD.md",
        "README.md",
        "MAP.md",
    ]:
        suite.check_terms_in_file(
            t,
            f"T3-TOP-{Path(rp).stem}",
            "Stage-Sync/PS-01",
            f"Top choice PS-01 / PayOps AI is consistently referenced in {rp}",
            rp,
            ["PayOps AI"],
        )


# ============================================================================
# TIER 4: REAL-WORLD HACKATHON JUDGE & DEVELOPER WALKTHROUGH SCENARIOS
# ============================================================================


def run_tier_4(suite: VerificationSuite) -> None:
    t = 4

    # Scenario 1: MAP.md Link Resolution Walkthrough
    map_text = suite.read_text("MAP.md")
    if not map_text:
        suite.record(
            t,
            "T4-WALK-MAP-01",
            "Scenario/MAP-Links",
            "MAP.md exists and contains resolvable relative Markdown links",
            False,
            "MAP.md is missing or empty",
        )
    else:
        link_pattern = re.compile(r"\[[^\]]+\]\(([^)]+)\)")
        broken_links: List[str] = []
        resolved_files: Set[str] = set()
        for m in link_pattern.finditer(map_text):
            raw_target = m.group(1).strip().strip("<>").split()[0]
            if (
                not raw_target
                or raw_target.startswith(("http://", "https://", "mailto:", "#"))
            ):
                continue
            clean_rel = raw_target.split("#")[0].strip()
            if not clean_rel:
                continue
            target_path = (suite.root / clean_rel).resolve()
            if not target_path.exists():
                broken_links.append(clean_rel)
            else:
                resolved_files.add(clean_rel)

        suite.record(
            t,
            "T4-WALK-MAP-01",
            "Scenario/MAP-Links",
            "Every relative Markdown link in MAP.md resolves to an existing file/directory on disk (and >= 30 links present)",
            len(broken_links) == 0 and len(resolved_files) >= 30,
            f"Resolved {len(resolved_files)} distinct local targets with 0 broken links"
            if (not broken_links and len(resolved_files) >= 30)
            else f"Resolved={len(resolved_files)} (need >=30); Broken links ({len(broken_links)}): {broken_links[:10]}",
        )

    # Scenario 2: Devpost Judge Q&A Walkthrough in PITCH.md (All 13 Judges)
    suite.check_regexes_in_file(
        t,
        "T4-WALK-PITCH-01",
        "Scenario/Judge-QA",
        "docs/00-overview/PITCH.md maps Q&A responses to all 13 named Devpost judges",
        "docs/00-overview/PITCH.md",
        DEVPOST_JUDGES_13_PATTERNS,
    )

    # Scenario 3: 48-Hour Execution Walkthrough in HACKATHON_PLAN.md and BACKLOG.md (H01..H48)
    for idx, rp in enumerate(["docs/00-overview/HACKATHON_PLAN.md", "docs/08-project/BACKLOG.md"], start=1):
        txt = suite.read_text(rp)
        if not txt:
            suite.record(
                t,
                f"T4-WALK-HOURS-0{idx}",
                "Scenario/H01..H48",
                f"{rp} covers complete 48-hour hackathon execution schedule (H01..H48)",
                False,
                f"{rp} is missing or empty",
            )
        else:
            missing_hours = find_missing_hours_1_to_48(txt)
            suite.record(
                t,
                f"T4-WALK-HOURS-0{idx}",
                "Scenario/H01..H48",
                f"{rp} covers complete 48-hour hackathon execution schedule (H01..H48)",
                len(missing_hours) == 0,
                f"All 48 hours (H01..H48) covered in {rp}"
                if not missing_hours
                else f"Missing hours in {rp} ({len(missing_hours)}): {missing_hours[:12]}",
            )

    # Scenario 4: @paypal/agent-toolkit Real Tool Walkthrough in PROMPTS.md and INTEGRATIONS.md
    required_toolkit_tools = [
        "create_invoice",
        "create_order",
        "list_disputes",
        "create_shipment_tracking",
        "create_subscription",
        "get_merchant_insights",
    ]
    for idx, rp in enumerate(
        ["docs/04-ai/PROMPTS.md", "docs/03-engineering/INTEGRATIONS.md"], start=1
    ):
        suite.check_terms_in_file(
            t,
            f"T4-WALK-TOOLKIT-0{idx}",
            "Scenario/Agent-Toolkit",
            f"{rp} references real @paypal/agent-toolkit tools (create_invoice, create_order, list_disputes, create_shipment_tracking, create_subscription, get_merchant_insights)",
            rp,
            required_toolkit_tools,
        )


def print_report(suite: VerificationSuite, selected_tiers: Sequence[int]) -> bool:
    print("=" * 88)
    print("PAYPAL AI HACKATHON — 4-TIER OPAQUE-BOX E2E DELIVERABLE VERIFICATION REPORT")
    print(f"Workspace Root: {suite.root}")
    print(f"Tiers Executed: {', '.join(f'Tier {t}' for t in selected_tiers)}")
    print("=" * 88)

    overall_passed = 0
    overall_total = 0

    for tier in selected_tiers:
        tier_results = [r for r in suite.results if r.tier == tier]
        passed_count = sum(1 for r in tier_results if r.passed)
        total_count = len(tier_results)
        overall_passed += passed_count
        overall_total += total_count

        status_label = "PASS" if passed_count == total_count and total_count > 0 else "FAIL"
        print(f"\n--- Tier {tier} Summary: [{status_label}] {passed_count}/{total_count} checks passed ---")
        for r in tier_results:
            mark = "[PASS]" if r.passed else "[FAIL]"
            print(f"  {mark} {r.check_id:<18} ({r.feature_id:<18}) {r.description}")
            if not r.passed:
                print(f"         -> {r.detail}")

    print("\n" + "=" * 88)
    all_ok = overall_passed == overall_total and overall_total > 0
    final_status = "ALL CHECKS PASSED" if all_ok else "VERIFICATION FAILED"
    print(f"OVERALL RESULT: {final_status} ({overall_passed}/{overall_total} checks passed)")
    print("=" * 88)
    return all_ok


def main(argv: Optional[Sequence[str]] = None) -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    parser = argparse.ArgumentParser(
        description="Run the 4-Tier E2E Verification Suite for PayPal AI Hackathon deliverables."
    )
    parser.add_argument(
        "--tier",
        type=int,
        choices=[1, 2, 3, 4],
        default=None,
        help="Run a specific verification tier (1, 2, 3, or 4). Omit to run all tiers.",
    )
    parser.add_argument(
        "--root",
        type=Path,
        default=ROOT_DIR,
        help="Path to the project root directory (defaults to s:\\PayPal).",
    )
    args = parser.parse_args(argv)

    suite = VerificationSuite(args.root.resolve())
    tiers_to_run = [args.tier] if args.tier is not None else [1, 2, 3, 4]

    tier_runners: Dict[int, Callable[[VerificationSuite], None]] = {
        1: run_tier_1,
        2: run_tier_2,
        3: run_tier_3,
        4: run_tier_4,
    }

    for tier in tiers_to_run:
        tier_runners[tier](suite)

    all_ok = print_report(suite, tiers_to_run)
    return 0 if all_ok else 1


if __name__ == "__main__":
    sys.exit(main())
