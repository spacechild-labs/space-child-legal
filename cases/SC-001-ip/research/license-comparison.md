# License Comparison: Space Child License v1.0 vs. Existing Ethical & Source-Available Licenses

**Date:** 2026-03-13  
**Case:** SC-001-ip  
**Author:** Kannaka (AI Legal Research)

---

## 1. Executive Summary

The Space Child License (SCL) is a **peace-conditional open source license** — a novel category that combines permissive commercial use with a specific prohibition on offensive military and oppressive uses, plus a "war tax" mechanism for negotiated licensing. This report compares the SCL's design requirements against 8 existing licenses that occupy the ethical/source-available/restricted-use space.

**Key finding:** No existing license combines all of SCL's elements — particularly the self-defense carve-out, war tax mechanism, and copyleft limited to the peace clause. The SCL occupies a unique niche between the Hippocratic License (broad ethical restrictions) and permissive licenses (no restrictions).

---

## 2. License Summaries

### 2.1 Space Child License v1.0 (Proposed)
- **Type:** Peace-conditional open source
- **Origin:** Space Child ecosystem (Nick Flach)
- **Philosophy:** Free for peaceful use; offensive warfare/oppression violates license; defensive military OK; offensive military must pay
- **OSI-approved:** No (by design — use restrictions violate OSD)

### 2.2 Hippocratic License 3.0 (HL3)
- **Type:** Ethical source
- **Origin:** Organization for Ethical Source (Coraline Ada Ehmke)
- **Philosophy:** Software shall not be used to harm people; extensive human rights conditions based on UN declarations
- **OSI-approved:** No

### 2.3 Anti-996 License 1.0
- **Type:** Labor-rights conditional
- **Origin:** Chinese tech worker movement (996.ICU)
- **Philosophy:** Software cannot be used by employers violating labor standards (ILO conventions)
- **OSI-approved:** No

### 2.4 Server Side Public License (SSPL) v1
- **Type:** Strong copyleft (service-oriented)
- **Origin:** MongoDB, Inc.
- **Philosophy:** If you offer the software as a service, you must open-source your entire service stack
- **OSI-approved:** No (rejected)

### 2.5 Commons Clause v1.0
- **Type:** Commercial restriction add-on
- **Origin:** Heather Meeker / FOSSA
- **Philosophy:** Appended to existing OSS license; prohibits "selling" the software
- **OSI-approved:** No (not a standalone license)

### 2.6 PolyForm Licenses (Suite)
- **Type:** Source-available (various restrictions)
- **Origin:** PolyForm Project (Heather Meeker et al.)
- **Philosophy:** Standardized restrictive licenses for different business needs (noncommercial, no-compete, internal-use, etc.)
- **OSI-approved:** No

### 2.7 Functional Source License (FSL) 1.1
- **Type:** Delayed open source
- **Origin:** Sentry / Fair Source movement
- **Philosophy:** Restricted for 2 years (no competing products), then converts to Apache 2.0 or MIT
- **OSI-approved:** No (becomes OSI-approved after conversion)

### 2.8 Business Source License (BSL) 1.1
- **Type:** Delayed open source
- **Origin:** MariaDB
- **Philosophy:** Source available with additional use grant; converts to open source after change date (up to 4 years)
- **OSI-approved:** No (becomes OSI-approved after conversion)

### 2.9 Cooperative Software License (CSL)
- **Type:** Cooperative-conditional
- **Origin:** Cooperative movement
- **Philosophy:** Free for cooperatives and individuals; commercial entities must be worker-owned or pay for license
- **OSI-approved:** No

---

## 3. Comparison Matrix

### 3.1 Permissions

| Dimension | SCL v1.0 | HL3 | Anti-996 | SSPL | Commons Clause | PolyForm Shield | FSL 1.1 | BSL 1.1 | CSL |
|-----------|----------|-----|----------|------|----------------|-----------------|---------|---------|-----|
| **Use** | ✅ Peaceful | ✅ Ethical | ✅ Labor-compliant | ✅ | ✅ | ✅ Non-competing | ✅ Non-competing | ✅ Per grant | ✅ Coops/individuals |
| **Copy** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Modify** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Distribute** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Patent grant** | TBD | ✅ Explicit | ❌ No grant | ✅ | Per base license | ❌ | Per conversion | Per base | ❌ |
| **Sublicense** | TBD | ❌ | ❌ | ✅ (copyleft) | Per base license | ❌ | ❌ | Per base | ❌ |

### 3.2 Conditions & Obligations

| Dimension | SCL v1.0 | HL3 | Anti-996 | SSPL | Commons Clause | PolyForm Shield | FSL 1.1 | BSL 1.1 | CSL |
|-----------|----------|-----|----------|------|----------------|-----------------|---------|---------|-----|
| **Attribution** | ✅ Required | ✅ Required | ✅ Required | ✅ Required | Per base license | ✅ Required | ✅ Required | ✅ Required | ✅ Required |
| **Copyleft** | Peace clause only | ❌ | ❌ | ✅ Strong (service) | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Source disclosure** | ❌ | ❌ | ❌ | ✅ Entire stack | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Same-license derivatives** | ✅ Peace clause carries | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Notice/marking** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### 3.3 Limitations & Restrictions

| Dimension | SCL v1.0 | HL3 | Anti-996 | SSPL | Commons Clause | PolyForm Shield | FSL 1.1 | BSL 1.1 | CSL |
|-----------|----------|-----|----------|------|----------------|-----------------|---------|---------|-----|
| **Commercial use** | ✅ Peaceful commercial OK | ✅ Ethical commercial OK | ✅ Labor-compliant OK | ✅ | ❌ No selling | ✅ Non-competing | ✅ Non-competing | Per grant | ✅ Coops only (free) |
| **Military use** | ⚠️ Defensive OK; Offensive = paid license | ❌ Prohibited (weapons, surveillance) | No restriction | No restriction | No restriction | No restriction | No restriction | No restriction | No restriction |
| **Government use** | ✅ Self-defense OK | ⚠️ Conditional | No restriction | No restriction | No restriction | No restriction | No restriction | No restriction | No restriction |
| **SaaS/hosting** | ✅ | ✅ | ✅ | ⚠️ Must open-source stack | ❌ If "selling" | ⚠️ If competing | ❌ If competing | Per grant | ✅ |
| **Warranty** | ❌ None | ❌ None | ❌ None | ❌ None | Per base | ❌ None | ❌ None | ❌ None | ❌ None |
| **Liability** | ❌ Limited | ❌ Limited | ❌ Limited | ❌ Limited | Per base | ❌ Limited | ❌ Limited | ❌ Limited | ❌ Limited |

### 3.4 Ethical Clauses

| Dimension | SCL v1.0 | HL3 | Anti-996 | SSPL | Commons Clause | PolyForm | FSL | BSL | CSL |
|-----------|----------|-----|----------|------|----------------|----------|-----|-----|-----|
| **Human rights** | ✅ Anti-oppression | ✅ Comprehensive (12+ articles) | ⚠️ Labor only | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Anti-warfare** | ✅ Core clause | ✅ Included | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Labor rights** | ❌ | ✅ | ✅ Core clause | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Environmental** | ❌ | ✅ (ecocide, fossil fuels) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Privacy** | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Indigenous rights** | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Worker ownership** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ Core clause |
| **Discrimination** | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

### 3.5 Enforcement Mechanisms

| Dimension | SCL v1.0 | HL3 | Anti-996 | SSPL | Commons Clause | PolyForm | FSL | BSL | CSL |
|-----------|----------|-----|----------|------|----------------|----------|-----|-----|-----|
| **Automatic termination** | ✅ On violation | ✅ On violation | ✅ | ✅ (GPL-style) | Per base | ✅ | ✅ | ✅ | ✅ |
| **Cure period** | TBD | ✅ 60 days | ❌ | ✅ 30 days (GPL-style) | Per base | ✅ 30 days | ❌ | ❌ | ❌ |
| **Injunctive relief** | ✅ Explicit | ✅ Explicit | ❌ | Standard | Standard | Standard | Standard | Standard | Standard |
| **War tax / paid licensing** | ✅ Unique mechanism | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Arbitration** | TBD | ✅ Optional | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Time-based conversion** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ 2 years → OSS | ✅ Up to 4 years → OSS | ❌ |

---

## 4. What Makes the Space Child License Unique

### 4.1 Novel Elements (Not Found in Any Existing License)

1. **The War Tax Mechanism**  
   No existing license creates a *paid licensing tier for offensive military use*. Ethical licenses either prohibit military use entirely (HL3) or don't address it at all. SCL creates a middle path: you can use it for war, but you pay for it. This is pragmatic and potentially revenue-generating.

2. **Self-Defense Carve-Out**  
   The explicit distinction between defensive and offensive military use is unprecedented in software licensing. HL3 prohibits weapons broadly. SCL accepts the reality that nations defend themselves and permits defensive use while restricting aggression.

3. **Copyleft Limited to the Peace Clause**  
   Traditional copyleft (GPL, SSPL) requires derivative works to use the same license for *code sharing* reasons. SCL's copyleft is *ethical copyleft* — derivatives must carry forward the peace restriction, but there's no source-disclosure obligation. This is a novel mechanism.

4. **"Peace-Conditional" Category**  
   SCL creates a new license category. Existing categories include:
   - Permissive (MIT, Apache) — no restrictions
   - Copyleft (GPL, AGPL) — share-alike
   - Ethical source (HL3, Anti-996) — broad ethical restrictions
   - Source-available (BSL, FSL, PolyForm) — business restrictions
   - Commons Clause — anti-selling add-on
   
   SCL is none of these. It's permissive for commercial use but conditional on peace. It's a focused ethical license with a monetization mechanism.

### 4.2 Comparison to Closest Analogues

#### vs. Hippocratic License 3.0
| Aspect | SCL | HL3 |
|--------|-----|-----|
| Ethical scope | Narrow (peace/warfare only) | Broad (12+ human rights areas) |
| Commercial use | Unrestricted (peaceful) | Unrestricted (ethical) |
| Military use | Nuanced (defensive OK, offensive paid) | Blanket prohibition |
| Enforceability | Higher (narrower = clearer) | Lower (broad = subjective) |
| Community adoption friction | Lower | Higher (many restrictions) |

**Verdict:** SCL is more focused and pragmatic. HL3 tries to be a universal ethical framework; SCL picks one battle (peace) and fights it with precision.

#### vs. Commons Clause
| Aspect | SCL | Commons Clause |
|--------|-----|----------------|
| What's restricted | Offensive military use | All commercial selling |
| Add-on or standalone | Standalone | Add-on to existing license |
| Mechanism | Paid licensing tier | Blanket prohibition |

**Verdict:** Completely different goals. Commons Clause protects business models; SCL protects peace.

#### vs. FSL / BSL (Delayed Open Source)
| Aspect | SCL | FSL/BSL |
|--------|-----|---------|
| Time-based conversion | No | Yes (2-4 years) |
| What's restricted | Warfare | Competition |
| Perpetual | Yes | No (becomes permissive) |

**Verdict:** SCL is permanent in its peace restriction. FSL/BSL are business tools with planned obsolescence.

### 4.3 Potential Challenges

1. **Defining "offensive" vs. "defensive" military use** — This is the SCL's hardest legal problem. A military operation can be framed as either. The license will need clear definitions, possibly referencing international law (UN Charter Article 51 on self-defense).

2. **Enforcement against state actors** — Governments can claim sovereign immunity. The war tax mechanism may be unenforceable against non-compliant state entities.

3. **OSI non-compliance** — By design, SCL is not OSI-approved (use restrictions violate OSD #6: no discrimination against fields of endeavor). This limits adoption in OSI-only ecosystems. However, many successful projects (MongoDB/SSPL, MariaDB/BSL, Sentry/FSL) operate outside OSI approval.

4. **Supply chain complexity** — If company A uses SCL-licensed code, and company A sells to military contractor B, who sells to government C for offensive operations — who violated the license? The chain of responsibility needs to be defined.

---

## 5. Strategic Recommendations

1. **Draft the SCL with narrow, precise language** for the peace clause. Reference specific international legal frameworks (UN Charter, Geneva Conventions) for definitions of offensive vs. defensive military action.

2. **Include a cure period** (30-60 days) for non-willful violations. This is standard practice (HL3: 60 days, GPL: 30 days) and increases enforceability.

3. **Consider a dual-licensing model** for repos already under MIT: MIT for general use + SCL peace clause as an additional restriction for new code.

4. **The war tax is SCL's killer feature** — no other license monetizes ethical restrictions. Draft it as a formal "Government/Military Use License" separate from the SCL, referenced by the SCL's enforcement section.

5. **Seek legal review specifically on:**
   - Iowa contract law applicability
   - International enforceability of peace clauses
   - Sovereign immunity challenges
   - Definition of "armed aggression" vs. "self-defense" in license terms

---

## 6. License Landscape Map

```
                    MORE RESTRICTIVE
                         ↑
                         |
          SSPL ──────────┤
          (service        |
           copyleft)      |
                         |
      HL3 ───────────────┤──── Anti-996
      (broad ethics)     |     (labor ethics)
                         |
          CSL ───────────┤
          (coop-only)    |
                         |
    ╔═══════════════╗    |
    ║  SPACE CHILD  ║────┤
    ║  (peace-only) ║    |
    ╚═══════════════╝    |
                         |
    Commons Clause ──────┤
    (no selling)         |
                         |
    PolyForm Shield ─────┤
    (no competing)       |
                         |
    FSL/BSL ─────────────┤
    (temporary            |
     restriction)        |
                         |
    MIT / Apache ────────┤
    (permissive)         |
                         ↓
                    LESS RESTRICTIVE
```

*Note: The SCL sits between broad ethical licenses and business-model licenses. It is ethically motivated but commercially permissive — a unique position.*

---

## Appendix: Reference Links

- Hippocratic License 3.0: https://firstdonoharm.dev/version/3/0/full.html
- Anti-996 License: https://github.com/996icu/996.ICU
- SSPL: https://www.mongodb.com/legal/licensing/server-side-public-license
- Commons Clause: https://commonsclause.com/
- PolyForm Project: https://polyformproject.org/licenses/
- FSL: https://fsl.software/
- BSL: https://mariadb.com/bsl11/
- Fair Source: https://fair.io/
- OSI Open Source Definition: https://opensource.org/osd

---

*This research supports the drafting of Space Child License v1.0. It is not legal advice.*
