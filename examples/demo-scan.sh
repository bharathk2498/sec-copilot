#!/bin/bash

echo "🛡️ SecCopilot Demo - All Scan Types"
echo "=================================="

echo "1. Basic Security Scan:"
sec-copilot scan --demo

echo -e "\n2. Executive Summary:"
sec-copilot scan --demo --mode executive

echo -e "\n3. JSON Output:"
sec-copilot scan --demo --output json

echo -e "\n4. Markdown Report:"
sec-copilot scan --demo --output markdown

echo -e "\n5. CI/CD Gate Test:"
sec-copilot ci-gate --demo --fail-on high

echo -e "\n✅ Demo completed!"
