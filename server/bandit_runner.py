from __future__ import annotations

import json
import subprocess
from pathlib import Path
from typing import Any, Dict, List


def _bandit_cmd(paths: List[str]) -> List[str]:
    """
    Build the bandit CLI command.
    -r: recurse
    -f json: machine-readable output
    -q: quiet banner
    --configfile: use .bandit.yaml if present
    """
    cmd = ["bandit", "-r", *paths, "-f", "json", "-q"]
    if Path(".bandit.yaml").exists():
        cmd.extend(["--configfile", ".bandit.yaml"])
    return cmd


def run_bandit(paths: List[str] | None = None) -> Dict[str, Any]:
    """
    Run Bandit and return a normalized dict:
    {
      "ok": bool,
      "summary": { "total": int, "metrics": {...} },
      "findings": [
         { "file": str, "line": int, "severity": str, "confidence": str,
           "test_id": str, "test_name": str, "message": str, "code": str }
      ],
      "error": optional str
    }
    """
    if not paths:
        paths = ["server"]  # default scan target

    try:
        proc = subprocess.run(
            _bandit_cmd(paths),
            check=False,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )
    except FileNotFoundError:
        return {
            "ok": False,
            "error": "Bandit not found. Install it with `pip install bandit`.",
            "findings": [],
        }

    # Bandit exit codes: 0 = no issues, 1 = issues found, others = failure
    if proc.returncode not in (0, 1):
        return {
            "ok": False,
            "error": (proc.stderr or "Bandit failed").strip(),
            "findings": [],
        }

    try:
        raw = json.loads(proc.stdout or "{}")
    except json.JSONDecodeError:
        return {
            "ok": False,
            "error": "Could not parse Bandit JSON output.",
            "findings": [],
        }

    issues = raw.get("results", []) or []
    findings: List[Dict[str, Any]] = []
    for it in issues:
        findings.append({
            "file": it.get("filename"),
            "line": it.get("line_number"),
            "severity": it.get("issue_severity"),
            "confidence": it.get("issue_confidence"),
            "test_id": it.get("test_id"),
            "test_name": it.get("test_name"),
            "message": it.get("issue_text"),
            "code": it.get("code"),
        })

    return {
        "ok": True,
        "summary": {
            "total": len(findings),
            "metrics": raw.get("metrics", {}),
        },
        "findings": findings,
    }


if __name__ == "__main__":
    # quick manual test: python server/bandit_runner.py
    import pprint
    pprint.pp(run_bandit(["server"]))
