# Rule policy

## Built-in removals

Built-in rules are intentionally narrow. They target parameter names commonly created for advertising attribution, campaign analytics, click IDs, and email campaign tracking. Matching is case-insensitive and decodes the parameter name for classification.

`utm_` and `pk_` are treated as prefixes. Other built-ins are exact names. Values do not influence classification.

## Preservation rule

Anything not matched is preserved exactly as it appeared in the query string, including encoding, value, duplicate position, and whether it used an equals sign. This protects application state and makes the transformation reviewable.

Empty query segments are discarded. If all meaningful parameters are removed, the trailing question mark is removed.

## Custom rules

Custom rules are comma- or newline-separated. A trailing `*` means prefix matching. Keep rules run first, so a user can retain a built-in tracker when a particular site uses that name functionally.

## Adding a built-in rule

A proposal should include examples from more than one implementation, explain why the name is tracking-specific rather than ambiguous, and add tests for casing, encoding, duplicates, keep overrides, and nearby functional names.

