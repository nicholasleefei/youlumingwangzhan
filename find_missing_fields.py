#!/usr/bin/env python3
import re

def extract_admin_fields():
    with open(r'src/pages/admin/AdminModelDetails.tsx', 'r', encoding='utf-8') as f:
        content = f.read()

    pattern = r'insertData\.([a-zA-Z0-9_]+)\s*='
    fields = re.findall(pattern, content)
    return set(fields)

def extract_config_fields():
    with open(r'src/utils/fieldLabels.ts', 'r', encoding='utf-8') as f:
        content = f.read()

    fields = set()
    groups_match = re.search(r'export const modelDetailsFieldGroups = ({.*?});', content, re.DOTALL)
    if groups_match:
        groups_str = groups_match.group(1)
        fields_matches = re.findall(r'\[(.*?)\]', groups_str)

        for fields_match in fields_matches:
            field_pattern = r"'([^']*)'"
            group_fields = re.findall(field_pattern, fields_match)
            fields.update(group_fields)

    return fields

admin_fields = extract_admin_fields()
config_fields = extract_config_fields()

only_admin = admin_fields - config_fields

print("只在 AdminModelDetails.tsx 中存在的字段 (缺失的配置):")
for field in sorted(only_admin):
    print(f"'{field}',")
