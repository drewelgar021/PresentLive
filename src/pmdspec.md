# PresentMD Spec

## 1. Document Structure

### 1.1. The shape of a deck file

```markdown
‐‐‐
title: My Deck
author: A. Student
‐‐‐

<!‐‐ layout: title ‐‐>

# My Deck

A subtitle paragraph.

‐‐‐

## First slide

Content.

‐‐‐

## Second slide

Content.
```

Three levels: frontmatter configures the deck, ‐‐‐ separates slides, and directives configure
the slide they appear on.

### 1.2. Frontmatter

A YAML block, delimited by ‐‐‐, at the very top of the file. It must begin on line 1.

```markdown
‐‐‐
title: Riverside Redevelopment
author: A. Student
color: "#ffffff"
‐‐‐
```

Each line is split at its first colon, and the value is taken whole — so a value containing a colon
or a comma survives intact. Values are strings; nothing is coerced. title is the deck title and
the only source of it. Recognised keys are in Part 2; unrecognised keys are ignored rather than
being an error.

### 1.3. Slide Separation
A line containing only ‐‐‐ starts a new slide.

```markdown
## One

First slide content.

‐‐‐

## Two

Second slide content.
```

Everything from one separator to the next belongs to one slide. Content before the first sepa‐
rator belongs to the first slide.
A slide needs no heading. This is legal and produces one slide:

```markdown
‐‐‐
A statement with no heading above it.
‐‐‐
```

### 1.4. Headings

```markdown
# A large heading

## A smaller one

### Smaller again
```

Three heading levels, differing in size and weight. They are formatting, not structure: a
heading may appear anywhere on a slide, any number of times.

A layout may treat a heading specially — title places the first one large and centred (2.2) —
but that is the layout’s doing.


# 2. Directives

## 2.1. Syntax

**Deck‐wide** — a key in the frontmatter:

```markdown
‐‐‐
backgroundColor: "#1e3a5f"
layout: "default"
‐‐‐
```

**One slide** — an HTML comment anywhere on that slide:

```markdown
## A highlighted slide

<!‐‐ backgroundColor: #ffcc00 ‐‐>
```

Both come back as a key and a value, and the two are the same shape: the frontmatter is a set
of them, a comment is one. Values are strings — draft is "true", not true — and the first
colon splits, so a value may itself contain one.

What does not come back is scope. Nothing in either block says which slide it belongs to; that
is decided by where it sits.

Frontmatter configures the deck; a comment configures its slide. A directive comment
applies to the slide it appears on and no other, wherever on that slide it sits. The deck‐wide
value applies everywhere else.

## 2.2. The Directive Set

### Background Color

```markdown
<!-- backgroundColor: #1e3a5f -->
```
The slide’s background colour. Deck‐wide in the frontmatter, or on one slide in a comment —
the pair with color that makes a deck readable.


### Text Color

```markdown
color: #ffffff
```

The colour of text. Deck‐wide only — frontmatter, never a comment. There is no slide‐level
text colour in the output format, so one value serves the deck.

### Layout

```markdown
<!-- layout: section-->
```

How the slide's content is arranged.

- `title`: large centered heading, optional subtitle.
  Typically used as an opening slide
- `default`: heading at top, body beneath.
- `section`: large, centered heading, no body.
  Typically used as a divider between sections of the presentation.

A deck is default throughout unless a directive says otherwise.
Position decides nothing: a title slide is a slide that says so, and it may appear anywhere.

### Agenda
```markdown
<!-- agenda -->
```

Replaces the slide with a list of every slide heading in the deck, in order. Draft slides are left
out, and so is the agenda slide itself. It takes no value.

### Draft
```markdown
<!-- draft: true -->
```

Excludes the slide from the output entirely: no slide, no placeholder, and no gap in the numbering.
Slide‐only — a deck‐wide draft would produce nothing at all.

# 3. Block Content

## 3.1. Paragraphs

Consecutive non‐blank lines form one paragraph.

```markdown
Markdown goes in
and a presentation comes out.

A second paragraph.
```

## 3.2. Bullet lists

```markdown
- First
- Second
  - Nested
```

Two spaces of indent per level. An over‐indented item — jumping more than one level —
drops to the next level down rather than being an error.

## 3.3. Numbered lists

```markdown
1. Read the outline
2. build the model
```

Same rules apply for numbered lists as bullet lists.

## 3.4. Blockquotes

```markdown
> design is how it works.
```

Appears italicised, with a left indent.

# 4. Inline Content

## 4.1. Syntax

Applies within paragraphs, list items and headings.

```markdown
Plain, **bold**, _italic_, and ~~struck~~.
```

## 4.2. Nesting

```markdown
**bold with _italic_ inside**
```

Inline styling is processed as a tree, of arbitrary depth.
Bold text can contain italic or struck text.

# Appendix: A Complete Deck
```markdown
‐‐‐
title: Riverside Library Redevelopment
author: A. Student
backgroundColor: "#1e3a5f"
color: "#ffffff"
‐‐‐

<!‐‐ layout: title ‐‐>

# Riverside Library Redevelopment

Quarterly report to the board

‐‐‐

<!‐‐ agenda ‐‐>

‐‐‐

<!‐‐ layout: section ‐‐>

# Programme

‐‐‐

# Where we are

The build is **on schedule** and _slightly_ under budget.

‐ Roof and glazing weathertight
‐ Three weeks ahead of the revised date
‐ Fit‐out contractor appointed

### Still to do

1. Shelving delivery
2. Commissioning
3. Handover

‐‐‐

<!‐‐ backgroundColor: #ffcc00 ‐‐>

# Risks

‐ ~~Specialist shelving supplier~~ resolved 12 March
‐ Community consultation on opening hours

> Opening is still targeted for July.

‐‐‐

<!‐‐ draft: true ‐‐>

# Not ready
```
