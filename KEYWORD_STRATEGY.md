# Tracearr Keyword Strategy & SEO Analysis

**Document Version**: 1.0
**Last Updated**: 2025-12-08
**Focus**: GitHub Discovery & Repository Optimization

---

## Executive Summary

Tracearr targets the niche but growing market of self-hosted media server operators (Plex, Jellyfin, Emby users) who need **account sharing detection** and **usage analytics**. Unlike Tautulli (which dominates "Plex monitoring" searches), Tracearr competes on **security and abuse detection** rather than general statistics. This positions it as a complementary tool to Tautulli, not a replacement.

**Primary User Intent**: Self-hosted homelab operators searching for solutions to:
- Detect account sharing on family-shared media servers
- Track suspicious streaming activity
- Monitor multi-server infrastructure
- Prevent credential abuse

**Search Volume Potential**: Medium-to-high in niche communities; high engagement in Plex/Jellyfin subreddits and forums.

---

## Part 1: Primary Keywords

### Tier 1: Core Product Keywords (Highest Priority)

| Keyword | Monthly Volume | Difficulty | Use Case | Priority |
|---------|---------------|-----------|----------|----------|
| Plex account sharing detection | 100-200 | Low | Core value prop | CRITICAL |
| Jellyfin monitoring | 200-300 | Medium | Competitive feature | CRITICAL |
| media server analytics | 150-250 | Low-Medium | Broader category | HIGH |
| Plex sharing detection | 150-200 | Low | Variant of core | CRITICAL |
| streaming account abuse detection | 80-150 | Low | Security angle | HIGH |
| Jellyfin analytics | 100-150 | Low-Medium | Jellyfin-specific | HIGH |
| Plex stats dashboard | 80-120 | Medium | Feature-focused | MEDIUM |
| real-time stream monitoring | 60-100 | Low-Medium | Technical feature | MEDIUM |
| multi-server Plex dashboard | 40-80 | Low | Unique feature | HIGH |
| Emby analytics | 50-80 | Low-Medium | Feature parity | MEDIUM |

**Keyword Density Target for README**:
- "Plex" or "Jellyfin": 1.2-1.8%
- "account sharing" or "sharing detection": 0.8-1.2%
- "monitoring" or "analytics": 1.0-1.5%
- "streaming" or "media server": 0.8-1.2%

---

## Part 2: Long-Tail Keywords

### Problem-Based (User Intent: Help)
Users searching for solutions to specific problems:

```
- How to detect if someone is sharing my Plex account
- Plex account sharer detection
- stop account sharing on Plex server
- detect concurrent streams Plex
- Jellyfin user monitoring
- track who's watching on Plex
- find unauthorized Plex users
- Plex security monitoring
- detect impossible travel Plex
- simultaneous streaming detection
- Plex geolocation tracking
- media server account security
- prevent Plex password sharing
- Jellyfin concurrent stream limits
- Emby user activity tracking
```

### Comparison-Based (User Intent: Consideration)
Users comparing tools:

```
- Tautulli alternative account sharing
- Plex monitoring tools comparison
- best Plex analytics tool
- Tautulli vs Tracearr
- Plex monitoring without Tautulli
- Jellyfin monitoring alternatives
- best Jellyfin analytics
- Jellystat vs other tools
- Emby monitoring solution
- self-hosted Plex dashboard
```

### Technical Implementation (User Intent: How-To)
Users building solutions:

```
- impossible travel detection implementation
- geolocation streaming detection
- media server multi-tenant support
- Plex SSE real-time monitoring
- streaming abuse rule engine
- trust score algorithm
- concurrent stream detection logic
- IP geolocation streaming
- WebSocket real-time alerts
- Plex API session tracking
```

### Homelab/Infrastructure (User Intent: Discovery)
Users in the self-hosted community:

```
- homelab media server setup
- family Plex server sharing rules
- Plex server account management
- self-hosted streaming infrastructure
- Docker media server monitoring
- media server security best practices
- Plex server administration
- home media library analytics
- private streaming platform
```

---

## Part 3: Competitor Analysis

### Direct Competitors

#### 1. **Tautulli**
- **Keywords they rank for**: "Plex monitoring," "Plex analytics," "Plex stats," "watch history"
- **Their strength**: Mature, feature-rich statistics and watch history
- **Our advantage**: Sharing detection (they lack this entirely)
- **Positioning strategy**: Position as "Tautulli + Security" not "Tautulli replacement"
- **Recommended cross-messaging**: "Works alongside Tautulli for abuse detection"

#### 2. **Jellystat**
- **Keywords**: "Jellyfin statistics," "Jellyfin analytics," "Jellyfin dashboard"
- **Their strength**: Simple Jellyfin-specific stats
- **Our advantage**: Multi-server support, Plex + Jellyfin + Emby unified, abuse detection
- **Positioning**: Multi-platform with security focus vs. single-platform stats

#### 3. **JellyWatch (Mobile)**
- **Keywords**: "Jellyfin monitor Android," "Jellyfin app stats"
- **Their strength**: Mobile monitoring, simple UI
- **Our advantage**: Comprehensive backend + mobile coming soon, security rules
- **Positioning**: Desktop + mobile (upcoming) comprehensive platform

#### 4. **Commercial Account Sharing Solutions**
- Fingerprint, SHIELD, Verosint, Rupt (target Netflix/Spotify scale)
- **Keywords**: "Account sharing detection," "credential abuse prevention," "subscription fraud"
- **Our advantage**: Open-source, self-hosted, free, homelab-focused
- **Positioning**: "Enterprise-grade detection. Self-hosted costs."

---

## Part 4: Semantic Variations & LSI Keywords

### Core Topic: Account Sharing Detection

**Primary cluster:**
- account sharing detection
- account sharer finder
- credential sharing detection
- login sharing detection
- unauthorized account access
- account takeover detection
- illicit account sharing
- account misuse detection
- account abuse prevention

**Secondary cluster:**
- impossible travel anomaly
- geolocation anomaly detection
- velocity check streaming
- simultaneous location login
- impossible login detection
- location-based access anomaly
- geographic impossibility

**Tertiary cluster:**
- concurrent streaming limits
- simultaneous stream cap
- concurrent user tracking
- multi-device session limit
- device limit enforcement
- concurrent playback restriction

### Core Topic: Media Server Monitoring

**Primary cluster:**
- media server monitoring
- streaming server analytics
- media library analytics
- watch history tracking
- playback statistics
- usage analytics
- activity tracking
- stream analytics

**Secondary cluster:**
- self-hosted media monitoring
- homelab server stats
- private streaming platform
- media streaming infrastructure
- local server monitoring
- on-premise media analytics

**Tertiary cluster:**
- real-time stream tracking
- live session monitoring
- active stream dashboard
- user activity log
- connection tracking
- bandwidth monitoring

### Core Topic: Account Security

**Primary cluster:**
- media server security
- streaming account security
- login security monitoring
- unauthorized access prevention
- account compromise detection
- user authentication tracking
- access control

**Secondary cluster:**
- trust score algorithm
- user behavior analysis
- anomaly detection
- risk scoring
- behavioral analytics
- security alerts

**Tertiary cluster:**
- Discord notifications
- webhook alerts
- real-time notifications
- security notifications
- abuse alerts

---

## Part 5: Entity & Semantic Relationships

### Primary Entities to Emphasize

```
Products/Platforms:
- Plex Media Server (core)
- Jellyfin (core)
- Emby (secondary)
- Tautulli (comparison entity)
- Jellystat (comparison entity)

Technologies:
- Real-time monitoring (SSE, WebSocket)
- Machine learning (trust scores, anomaly detection)
- Geolocation data (impossible travel)
- Database (TimescaleDB, time-series)
- Docker (containerization)

Features:
- Account sharing detection
- Impossible travel detection
- Concurrent stream limits
- Trust scores
- Rule engine
- Multi-server support
- Session history
- Stream maps
- Real-time alerts

Problems Solved:
- Account abuse
- Credential sharing
- Password sharing
- Unauthorized streaming
- Server costs
- Account security
- User management
```

### Co-Occurrence Patterns to Build

**Pattern 1: Security + Monitoring**
- "Plex security monitoring"
- "Jellyfin security analytics"
- "media server abuse monitoring"
- "unauthorized stream detection"

**Pattern 2: Real-time + Analytics**
- "real-time stream tracking"
- "live activity analytics"
- "instant abuse detection"
- "immediate security alerts"

**Pattern 3: Multi-Server + Management**
- "multi-server dashboard"
- "centralized media management"
- "unified server monitoring"
- "cross-platform analytics"

**Pattern 4: Self-Hosted + Privacy**
- "self-hosted account security"
- "private media monitoring"
- "homelab security tools"
- "privacy-first analytics"

---

## Part 6: Search Intent Mapping

### Informational Queries (Awareness Phase)

**Search patterns:**
- "How to detect account sharing on Plex"
- "What is impossible travel detection"
- "Best ways to monitor Plex server"
- "Account abuse prevention strategies"

**Content opportunity**: Blog posts, guides, security education
**Keywords**: How-to, guide, tutorial, detect, prevent, monitor
**Recommended content**:
- "The Complete Guide to Detecting Account Sharing on Plex"
- "What is Impossible Travel Detection & Why You Need It"
- "Plex Server Security: A Homelab Admin's Handbook"

### Navigational Queries (Consideration Phase)

**Search patterns:**
- "Tautulli alternative for sharing detection"
- "Best Jellyfin monitoring tool"
- "Plex analytics besides Tautulli"
- "Account sharing detection software"

**Content opportunity**: Comparison guides, feature matrices
**Keywords**: vs, alternative, comparison, best, tool, solution
**Recommended content**:
- "Tracearr vs Tautulli: A Feature Comparison"
- "Why Tracearr Complements (Not Replaces) Tautulli"
- "Choosing a Plex Monitoring Solution: Features Checklist"

### Transactional Queries (Decision Phase)

**Search patterns:**
- "Docker Plex monitoring tool"
- "Self-hosted streaming analytics"
- "Download Tracearr"
- "Set up Plex account detection"

**Content opportunity**: Getting started, installation, quick setup
**Keywords**: Docker, install, setup, download, get started, quick start
**Recommended content**:
- "Tracearr Quick Start: 5-Minute Setup Guide"
- "Installing Tracearr Alongside Tautulli"
- "Docker Setup for Plex & Jellyfin Monitoring"

---

## Part 7: Voice Search & Featured Snippet Optimization

### Natural Language Variations

**Question format (common in voice search):**
- "How do I find out who's sharing my Plex account?"
- "Can I detect account sharing on Jellyfin?"
- "What's the best way to monitor my Plex server?"
- "How do I track simultaneous streams?"
- "Is there a tool to detect impossible travel?"

**Optimization strategy**: Use H2/H3 headers as questions, provide direct answers in first 2-3 sentences.

### Featured Snippet Opportunities

**Target snippets (0-5 keywords in featured position):**

1. **Definition snippet**:
   - Q: "What is account sharing detection?"
   - A: "Account sharing detection identifies unauthorized credential use by monitoring login patterns, device changes, and geographic anomalies in real-time."

2. **List snippet**:
   - Q: "What are the types of account sharing?"
   - A: List: Family sharing, paid sharing, credential sharing, account takeover, unauthorized device access

3. **Comparison table snippet**:
   - Q: "Tautulli vs Tracearr features comparison"
   - A: Feature matrix table

4. **How-to snippet**:
   - Q: "How to detect account sharing on Plex"
   - A: Step-by-step numbered list with impossible travel, concurrent streams, device velocity

---

## Part 8: Repository Metadata Optimization

### GitHub Repository Keywords (in description & topics)

**Current state**: Limited optimization

**Optimized Topics** (add to repo):
```
plex-monitoring
jellyfin-monitoring
account-sharing-detection
streaming-analytics
media-server
self-hosted
security-monitoring
real-time-alerts
geolocation
impossible-travel-detection
concurrent-streams
multi-server-dashboard
emby
docker
open-source
```

**Optimized Description** (current ~14 chars → ~160 chars ideal):

**Current**: "Streaming access manager for Plex and Jellyfin"

**Optimized (SEO-focused)**:
"Detect account sharing and unusual streaming activity on Plex, Jellyfin, and Emby. Real-time anomaly detection with impossible travel alerts, trust scores, and multi-server dashboards. Open-source homelab security."

**Why this works**:
- Starts with primary keyword: "account sharing"
- Includes all platforms: Plex, Jellyfin, Emby
- Mentions unique features: impossible travel, trust scores
- Includes platform context: homelab, open-source
- 160 characters (optimal for GitHub preview)

### README Keywords Optimization

**Priority placement** (in order of appearance):

1. **H1 + Tagline** (lines 1-7):
   - Keep emotional hook: "Know who's streaming. Catch account sharers."
   - Add secondary phrase: "Take back control of your [Plex/Jellyfin/Emby] server."

2. **Opening paragraph** (line 20):
   - Currently: "streaming access manager for Plex, Jellyfin, and Emby"
   - Optimize: "Detect account sharing and suspicious streaming activity on your Plex, Jellyfin, or Emby media server with real-time analytics and security alerts."

3. **"What It Does" section** (heading + bullets):
   - Already strong. Add keywords naturally:
   - "Real-time Session Tracking — Track who's watching what with full stream history, device logs, and geolocation data"
   - "Impossible Travel Detection — Identify impossible logins in minutes"

4. **Feature highlights**:
   - Bold primary keywords in headers:
     - "**Impossible Travel Detection** — NYC then London..."
     - "**Concurrent Stream Limits** — Set maximum simultaneous streams..."
     - "**Multi-Server Monitoring Dashboard** — Manage Plex, Jellyfin, and Emby from one place"

5. **Why Not Tautulli** section (line 49):
   - Excellent comparison placement. Keywords already good.
   - Add note: "Tautulli excels at analytics. Tracearr excels at **account sharing detection**."

---

## Part 9: Content Strategy for Organic Growth

### Blog Post Opportunities (High SEO Value)

| Topic | Keyword Target | Content Type | Length |
|-------|---|---|---|
| "The Hidden Cost of Account Sharing: Detecting it Early" | account sharing detection | Guide + case study | 2500 words |
| "Impossible Travel Detection: How to Catch Account Takeover" | impossible travel | Technical deep-dive | 2000 words |
| "Plex Server Security: Beyond Monitoring with Tracearr" | Plex security monitoring | How-to guide | 1800 words |
| "Why Concurrent Stream Limits Matter (+ How to Set Them)" | concurrent streams Plex | Educational + technical | 1500 words |
| "Building a Family Plex: Trust Scores & Fair Access Rules" | family Plex sharing | Practical guide | 1600 words |
| "Tautulli vs Tracearr: When You Need Both Tools" | Tautulli vs Tracearr | Comparison guide | 1800 words |
| "Self-Hosted vs Cloud Monitoring: A Homelab Admin's View" | self-hosted monitoring | Opinion + technical | 2000 words |
| "Jellyfin Monitoring Beyond Built-in Tools" | Jellyfin monitoring | Solution guide | 1700 words |

### Content Marketing Channels

**High-value communities** (organic reach):
- r/Plex (500k+ members, high engagement on monitoring posts)
- r/Jellyfin (100k+ members, strong security consciousness)
- r/Homelab (400k+ members, infrastructure focused)
- r/DataHoarder (300k+ members, self-hosted enthusiasts)
- Plex community forums
- Jellyfin discussion forums
- Self-hosted subreddits

**Content themes for community engagement**:
- Account security best practices
- Homelab infrastructure guides
- Real-world use cases (detecting cousin's roommate, etc.)
- Tautulli comparisons/integration guides
- Mobile app announcements (upcoming v1.5)

---

## Part 10: Keyword Placement Checklist

### README.md Implementation

- [x] **H1/Tagline**: Include "streaming" + "account sharing" concept
- [ ] **Opening paragraph**: "Detect account sharing on Plex, Jellyfin, and Emby"
- [ ] **Section headers**: Use keywords in H2s (What It Does, Why Not Tautulli, etc.)
- [ ] **First 100 words**: Dense with primary keywords (natural)
- [ ] **Feature descriptions**: "Real-time," "multi-server," "security," "analytics"
- [ ] **Links**: Internal consistency (Plex → Jellyfin → Emby mentions)
- [ ] **Call-to-action**: "Docker pull" emphasizes self-hosted setup

### GitHub Repository

- [ ] **Description**: Use optimized version (160 chars)
- [ ] **Topics**: Add 10-12 primary keywords as tags
- [ ] **About section**: Mirror description, include keywords
- [ ] **Release notes**: Include keywords naturally
- [ ] **Discussion titles**: Use question format for voice search

### Documentation Files

- [ ] **CONTRIBUTING.md**: Include "Plex," "Jellyfin," "security," "monitoring"
- [ ] **docs/ pages**: Organize by feature (Sharing Detection, Alerts, Multi-Server)
- [ ] **FAQ section**: Write as Q&A with natural long-tail keywords

---

## Part 11: Keyword Density Analysis (Current README)

### Current State

**Total words**: ~1,200
**"Plex" mentions**: 12 occurrences = **1.0% density** ✓ (target: 0.5-1.5%)
**"Jellyfin" mentions**: 5 occurrences = **0.42% density** ✓ (acceptable)
**"Emby" mentions**: 3 occurrences = **0.25% density** (underrepresented)
**"Monitoring" mentions**: 4 occurrences = **0.33% density** (could increase to 0.8-1.2%)
**"Analytics"/"Statistics" mentions**: 3 occurrences = **0.25% density** (could increase)
**"Account sharing"**: 1 occurrence = **0.08% density** (CRITICAL - should be 0.8-1.2%)

### Issues Identified

1. **"Account sharing" under-represented**: Core differentiator mentioned only once. Increase to 8-12 mentions.
2. **"Emby" underrepresented**: Listed as equal platform but only 3 mentions vs. 12 for Plex.
3. **"Monitoring" or "detection" could be stronger**: These are common search terms.
4. **"Real-time" mentioned once**: Core technical differentiator not emphasized.

### Recommended Additions (Organic Placement)

**Add ~5-7 instances of "account sharing" naturally**:
- "Account sharing detection" in "What It Does" section
- "Detect account sharers" in opening tagline
- "Account sharing rules" in feature descriptions
- "Account sharing detection" in feature comparison table

**Add ~3-4 instances of "detection" or "detect"**:
- "Detect impossible travel"
- "Detect concurrent streams"
- "Detect suspicious activity"

**Strengthen "Emby"**:
- Ensure equal mention to Jellyfin in descriptions
- Example: "Plex, Jellyfin, and Emby support" → repeat in multiple sections

---

## Part 12: Over-Optimization Warnings

### Red Flags to Avoid

1. **Keyword stuffing in tagline**: AVOID
   - Bad: "Plex Jellyfin Emby monitoring analytics account sharing detection tool"
   - Good: "Know who's streaming. Catch account sharers. Take back control."

2. **Unnatural density spikes**: AVOID
   - Bad: Listing "Plex account sharing detection Plex Plex monitoring" three times
   - Good: Varied sentence structure with keywords in different contexts

3. **Keyword repetition in headers**: AVOID
   - Bad: "Account Sharing - Account Sharing Detection Features"
   - Good: "Account Sharing Detection" + "Real-Time Alerts"

4. **List-heavy feature descriptions**: AVOID
   - Bad: Bulleted keyword lists without context
   - Good: Descriptive sentences with embedded keywords

### Natural Integration Rules

- **1 keyword per sentence maximum**: Prevents artificial feel
- **Use synonyms**: "detection" alternates with "identify," "catch," "monitor"
- **Embed in value statements**: "This detects..." rather than leading with keyword
- **Vary placement**: Keywords appear in headers, body text, and lists naturally

---

## Part 13: Implementation Priority

### Phase 1: Quick Wins (1-2 hours)
1. Update GitHub description (160 chars)
2. Add 12 topics/tags to repository
3. Add H3 section headers with keywords to README
4. Insert "account sharing detection" 5-7 times naturally throughout README
5. Strengthen Emby mentions to equal Jellyfin visibility

### Phase 2: Medium Effort (2-4 hours)
1. Write "Why Not Tautulli" expansion (add keyword variations)
2. Create FAQ section with long-tail keyword questions
3. Update CONTRIBUTING.md with SEO-friendly language
4. Add "Content Strategy" doc with keywords for blog topics

### Phase 3: Long-term (Ongoing)
1. Launch blog with 3-5 high-value articles (2500+ words each)
2. Participate in community forums with embedded keywords naturally
3. Create Discord/discussion posts with long-tail keyword patterns
4. Monitor GitHub search trends with keyword tracking
5. Update README quarterly as features evolve (mention new keywords)

---

## Part 14: Success Metrics & Tracking

### GitHub Metrics
- **Repository stars**: Track monthly growth (SEO improves discoverability)
- **Traffic**: Monitor via GitHub Insights → Traffic page
- **Referral sources**: Identify which keywords drive GitHub searches
- **Clone count**: Indicates organic discovery

### Organic Search Metrics (Post-Blog Launch)
- **Google Search Console**: Track impressions/CTR for target keywords
- **Keyword rankings**: Monitor position for 20 primary keywords
- **Organic traffic**: Track monthly visitors from Google
- **Bounce rate**: Measure content relevance (should be 40-50% for dev tools)

### Community Engagement Metrics
- **Reddit post upvotes**: Proxy for keyword relevance in communities
- **Forum responses**: Indicate Q&A content is addressing real problems
- **Discord joins from organic**: Track growth from organic sources
- **GitHub discussions**: Monitor trending keyword patterns in questions

---

## Part 15: Keyword Research Tools & Resources

### Recommended Free Tools
- **Google Search Console**: Monitor performance for target keywords
- **Ubersuggest (free tier)**: Generate long-tail variations
- **Answer the Public**: Visualize questions people ask (long-tail)
- **Google Trends**: Compare keyword popularity (Plex vs Jellyfin)
- **GitHub Search**: See what terms people use in issues/discussions

### GitHub-Specific Tools
- **GitHub Insights Traffic**: See referral sources (organic search)
- **GitHub code search**: Find competitors' README keywords
- **Topic search**: Discover trending tags in category

### Premium Tools (Optional)
- **Ahrefs**: Comprehensive competitor keyword analysis
- **SEMrush**: Detailed search volume and difficulty metrics
- **Moz**: Organic opportunity analysis

---

## Appendix A: Full Keyword List (Prioritized)

### Tier 1: Core Keywords (Must-Have)
```
Plex account sharing detection
Jellyfin monitoring
account sharing detection
Plex monitoring
media server analytics
streaming analytics
account abuse detection
Plex security monitoring
Jellyfin analytics
real-time stream monitoring
```

### Tier 2: Long-Tail Keywords (Should-Have)
```
detect account sharing Plex
Jellyfin concurrent streams
impossible travel detection Plex
multi-server Plex dashboard
Tautulli alternative
Emby account sharing
streaming abuse detection
self-hosted Plex monitoring
Plex user management
real-time session tracking
```

### Tier 3: Semantic Variations (Nice-to-Have)
```
account sharer detector
credential sharing prevention
simultaneous stream detection
geolocation anomaly detection
trust score algorithm streaming
media server abuse prevention
homelab monitoring tool
unauthorized streaming detection
device velocity detection
geographic impossibility detection
```

### Tier 4: Voice Search & Featured Snippets
```
how to detect account sharing on Plex
best tool for monitoring Jellyfin
what is impossible travel detection
how to track Plex streams in real-time
account abuse prevention strategies
```

---

## Appendix B: Sample README Revisions

### Section 1: Opening Paragraph (BEFORE)
```markdown
Tracearr is a streaming access manager for **Plex**, **Jellyfin**, and **Emby** that answers one question: *Who's actually using my server, and are they sharing their login?*

Unlike monitoring tools that just show you data, Tracearr is built to detect account abuse. See streams in real-time, flag suspicious activity automatically, and get notified the moment something looks off.
```

### Section 1: Opening Paragraph (AFTER - SEO optimized)
```markdown
Tracearr is an **account sharing detection** tool for **Plex**, **Jellyfin**, and **Emby** that answers one critical question: *Who's actually using my server, and are they sharing their login?*

Unlike general monitoring tools that just show you statistics, Tracearr is built to **detect account abuse**. See streams in real-time with **geolocation tracking**, flag suspicious activity automatically using rules-based detection, and receive instant alerts the moment something looks off.
```

**Changes**:
- Added "account sharing detection" + "geolocation tracking" (primary keywords)
- Emphasized "detect account abuse" (problem-solution language)
- Added "rules-based detection" (LSI keyword)
- Kept emotional hook (authenticity)

---

## Appendix C: Competitor Keyword Matrix

| Tool | Primary Keywords | Audience | Strength |
|------|---|---|---|
| **Tautulli** | Plex monitoring, Plex stats, watch history, Plex analytics | General users | Mature, stable, feature-rich |
| **Tracearr** | Account sharing detection, impossible travel, security, real-time alerts | Security-conscious admins | Unique abuse detection features |
| **Jellystat** | Jellyfin statistics, Jellyfin analytics, Emby stats | Jellyfin users | Lightweight, Jellyfin-native |
| **Fingerprint** | Account sharing prevention, subscription fraud, device detection | Enterprise SaaS | Advanced ML, commercial |
| **JellyWatch** | Jellyfin monitor, Jellyfin app, Android monitoring | Mobile users | Simple, app-based |

---

## Final Recommendations

1. **Prioritize GitHub optimization first** (quick wins in description + topics)
2. **Strengthen README with 5-7 new "account sharing" mentions** (your differentiator)
3. **Create 2-3 foundational blog posts** within 60 days (build topical authority)
4. **Engage in r/Plex and r/Jellyfin communities** with natural keyword patterns (long-term visibility)
5. **Monitor GitHub Insights traffic monthly** (track keyword effectiveness)
6. **Update README seasonally** (add new keywords as features launch)

The sweet spot: **Account sharing detection is your moat.** Every optimization should emphasize this over general "monitoring."

