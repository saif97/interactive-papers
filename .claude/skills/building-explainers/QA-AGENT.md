# Clarity QA subagent

Step 6 of SKILL.md. Spawn a subagent on a **cheap fast model (Haiku)** to read the
rendered explainer as a first-time learner and report clarity problems. It checks whether
the component *teaches*, not whether it runs (step 5 already proved it runs).

Use the Agent tool with `subagent_type: "general-purpose"` and `model: "haiku"`. The
subagent reaches the browser through the session's chrome-devtools MCP tools — it must load
them with ToolSearch first (they are deferred). Make sure a local server is already serving
the project so the harness URL resolves.

## Prompt template

Fill in `<key>`, the human concept name, and the running server's `<port>`.

```
You are a first-time learner reviewing an interactive explainer for clarity. You are NOT
checking that buttons work — only whether the thing teaches its idea to a newcomer.

Open this page in the browser and step through every panel in order, front to back, using
the "Next →" button. It mounts one component in isolation:

  http://localhost:<port>/dev/explainer-preview.html?key=<key>

To drive the browser: use ToolSearch with
  select:mcp__chrome-devtools__list_pages,mcp__chrome-devtools__new_page,mcp__chrome-devtools__take_snapshot,mcp__chrome-devtools__click,mcp__chrome-devtools__take_screenshot
then new_page the URL, take_snapshot to read each panel, click "Next →" to advance.

The concept being taught is: <concept name>.

For each panel, judge it as a newcomer who does not already know this topic:
- Is the panel's single idea clear, or is it doing too much at once?
- Does every label/caption match what is actually shown?
- Is any term used before it is explained? Where would a newcomer stall?
- Does the writing follow plain language (one idea per sentence, concrete words)?

Then judge the whole: by the last panel, is the main point (the thesis) landed?

Report back ONLY:
1. Blockers — confusions that would stop a newcomer from getting it (panel #, what, why).
2. Minor — smaller wording or labeling nits.
3. One sentence: does the explainer land its thesis, yes or no?

Be concrete and brief. Do not suggest code changes or rewrite the component.
```

## Using the result

Treat the report as a punch list. Fix the blockers (and minor nits worth fixing) in the
explainer module, then re-run **step 5** on whatever you changed — the fix has to be
verified live too. Repeat until the subagent reports no blockers.
