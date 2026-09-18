import type { EmploymentType } from "./interfaces";

export interface ScrapedJob {
  title: string;
  company: string;
  location: string;
  link: string;
  description: string;
  employmentType: EmploymentType | "";
  extraDetails: string;
  site: string;
}

export type ScrapeResult =
  | { ok: true; job: ScrapedJob }
  | { ok: false; reason: string };

/**
 * Runs inside the job page (injected with chrome.scripting.executeScript).
 *
 * It is serialised with toString(), so it MUST stay self contained - it cannot
 * reference imports, module scope helpers or anything outside its own body.
 *
 * To support a new job board, add an entry to SITES below. Anything not listed
 * still works if the page ships schema.org JobPosting data or OpenGraph tags.
 */
function pageScraper() {
  const MAX_DESCRIPTION = 4000;

  const clean = (value: string): string =>
    value
      .replace(/\r/g, "")
      .replace(/[ \t ]+/g, " ")
      .replace(/ ?\n ?/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

  const readNode = (node: Element | null): string => {
    if (!node) return "";
    const el = node as HTMLElement;
    return clean(el.innerText || el.textContent || "");
  };

  const pick = (selectors: string[]): string => {
    for (const selector of selectors) {
      let found = "";
      try {
        found = readNode(document.querySelector(selector));
      } catch {
        found = "";
      }
      if (found) return found;
    }
    return "";
  };

  const metaContent = (names: string[]): string => {
    for (const name of names) {
      const el = document.querySelector(
        `meta[property="${name}"], meta[name="${name}"]`
      );
      const content = el?.getAttribute("content")?.trim();
      if (content) return clean(content);
    }
    return "";
  };

  const htmlToText = (html: string): string => {
    const holder = document.createElement("div");
    holder.innerHTML = html
      .replace(/<\s*br\s*\/?>/gi, "\n")
      .replace(/<\s*li[^>]*>/gi, "\n• ")
      .replace(/<\/\s*(p|div|li|ul|ol|h[1-6]|tr|section)\s*>/gi, "\n");
    return clean(holder.textContent || "");
  };

  const first = (...values: string[]): string => {
    for (const value of values) {
      if (value && value.trim()) return value.trim();
    }
    return "";
  };

  const titleCase = (value: string): string =>
    value
      .replace(/[-_+]+/g, " ")
      .replace(/\s+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim();

  const normaliseType = (raw: string): string => {
    const t = raw.toUpperCase().replace(/[^A-Z]/g, "");
    if (!t) return "";
    if (t.includes("FULLTIME")) return "Full-time";
    if (t.includes("PARTTIME")) return "Part-time";
    if (t.includes("INTERN") || t.includes("GRADUATE")) return "Internship";
    if (
      t.includes("CONTRACT") ||
      t.includes("TEMPORARY") ||
      t.includes("FIXEDTERM") ||
      t.includes("FREELANCE")
    )
      return "Contract";
    if (t.includes("CASUAL") || t.includes("PERDIEM") || t.includes("VOLUNTEER"))
      return "Casual";
    return "";
  };

  const path = location.pathname.split("/").filter(Boolean);

  type Field = string[] | (() => string);

  interface SiteConfig {
    test: RegExp;
    title?: Field;
    company?: Field;
    location?: Field;
    description?: Field;
    employmentType?: Field;
    link?: () => string;
  }

  /**
   * LinkedIn renames its top card classes regularly, so treat the DOM as a hint
   * and fall back to the page headline, which has been stable for years:
   * "Acme hiring Backend Engineer in Sydney, New South Wales | LinkedIn".
   */
  const headline = (() => {
    const raw = first(metaContent(["og:title"]), document.title || "").replace(
      /\s*\|\s*LinkedIn\s*$/i,
      ""
    );
    const withLocation = raw.match(/^(.+?)\s+hiring\s+(.+?)\s+in\s+(.+)$/i);
    if (withLocation) {
      return {
        company: clean(withLocation[1]),
        title: clean(withLocation[2]),
        location: clean(withLocation[3]),
      };
    }
    const withoutLocation = raw.match(/^(.+?)\s+hiring\s+(.+)$/i);
    if (withoutLocation) {
      return {
        company: clean(withoutLocation[1]),
        title: clean(withoutLocation[2]),
        location: "",
      };
    }
    return null;
  })();

  const firstLine = (value: string): string => clean(value.split("\n")[0]);

  /** The "Company · Location · 2 weeks ago · 40 applicants" summary line. */
  const linkedinSummary = (): string[] => {
    const containers = document.querySelectorAll(
      '.job-details-jobs-unified-top-card__primary-description-container, .job-details-jobs-unified-top-card__tertiary-description-container, [class*="top-card"] [class*="primary-description"], [class*="top-card"] [class*="tertiary-description"], .jobs-unified-top-card__subtitle-primary-grouping, .topcard__flavor-row'
    );
    const parts: string[] = [];
    containers.forEach((container) => {
      readNode(container)
        .split(/[·•|\n]/)
        .forEach((part) => {
          const value = clean(part);
          if (value && parts.indexOf(value) === -1) parts.push(value);
        });
    });
    return parts;
  };

  const linkedinCompany = (): string => {
    const name = first(
      firstLine(
        pick([
          ".job-details-jobs-unified-top-card__company-name a",
          ".job-details-jobs-unified-top-card__company-name",
          ".jobs-unified-top-card__company-name",
          ".topcard__org-name-link",
          ".topcard__flavor--black-link",
          '[class*="top-card"] [class*="company-name"] a',
          '[class*="top-card"] [class*="company-name"]',
          '[class*="top-card"] a[href*="/company/"]',
          '[class*="company-name"] a',
        ])
      ),
      headline?.company || "",
      linkedinSummary()[0] || ""
    );
    // The logo's alt text often rides along with the name.
    return clean(name.replace(/\s+logo$/i, ""));
  };

  const SITES: SiteConfig[] = [
    {
      test: /linkedin\.com$/,
      title: () =>
        first(
          pick([
            ".job-details-jobs-unified-top-card__job-title",
            ".jobs-unified-top-card__job-title",
            ".topcard__title",
            ".top-card-layout__title",
            '[class*="top-card"] h1',
          ]),
          headline?.title || ""
        ),
      company: linkedinCompany,
      location: () => {
        const company = linkedinCompany();
        const noise =
          /(\bago\b|applicant|clicked apply|promoted|reposted|easy apply|viewed|alumni|response|actively|recruit|hiring|follower|employee|connection|see how you compare|^\d+$)/i;

        const fromSummary = linkedinSummary().find(
          (part) =>
            part !== company &&
            part.length > 1 &&
            part.length < 120 &&
            !noise.test(part)
        );

        return first(
          fromSummary || "",
          headline?.location || "",
          pick([".topcard__flavor--bullet", ".jobs-unified-top-card__bullet"])
        );
      },
      description: [
        "#job-details",
        ".jobs-description__content",
        ".show-more-less-html__markup",
        ".description__text",
      ],
      employmentType: () =>
        Array.from(
          document.querySelectorAll(
            ".job-details-jobs-unified-top-card__job-insight, .description__job-criteria-item, .job-details-fit-level-preferences button"
          )
        )
          .map(readNode)
          .join(" "),
      link: () => {
        const viewMatch = location.pathname.match(/\/jobs\/view\/(\d+)/);
        const current = new URLSearchParams(location.search).get("currentJobId");
        const id = viewMatch ? viewMatch[1] : current;
        return id ? `https://www.linkedin.com/jobs/view/${id}/` : "";
      },
    },
    {
      test: /indeed\./,
      title: [
        '[data-testid="jobsearch-JobInfoHeader-title"]',
        "h1.jobsearch-JobInfoHeader-title",
        ".jobsearch-JobInfoHeader-title",
      ],
      company: [
        '[data-testid="inlineHeader-companyName"]',
        '[data-company-name="true"]',
        '[data-testid="jobsearch-CompanyInfoContainer"] a',
      ],
      location: [
        '[data-testid="inlineHeader-companyLocation"]',
        '[data-testid="jobsearch-JobInfoHeader-companyLocation"]',
        '[data-testid="job-location"]',
      ],
      description: ["#jobDescriptionText", ".jobsearch-JobComponent-description"],
      employmentType: ["#salaryInfoAndJobType", '[data-testid="jobDetails"]'],
      link: () => {
        const params = new URLSearchParams(location.search);
        const jk = params.get("vjk") || params.get("jk");
        return jk ? `${location.origin}/viewjob?jk=${jk}` : "";
      },
    },
    {
      test: /greenhouse\.io$/,
      title: [".job__title h1", "h1.app-title", ".app-title", "h1"],
      company: () =>
        first(
          pick([".job__company", ".company-name"]),
          metaContent(["og:site_name"]),
          titleCase(path[0] || "")
        ).replace(/^at\s+/i, ""),
      location: [".job__location", ".location", '[class*="location"]'],
      description: [".job__description", "#content", ".main"],
    },
    {
      test: /lever\.co$/,
      title: [".posting-headline h2", "h2"],
      company: () =>
        first(titleCase(path[0] || ""), metaContent(["og:site_name"])),
      location: [
        ".posting-categories .location",
        ".posting-category.location",
        '[class*="location"]',
      ],
      description: ['[data-qa="job-description"]', ".section-wrapper", ".content"],
      employmentType: [
        ".posting-categories .commitment",
        '[class*="commitment"]',
      ],
    },
    {
      test: /ashbyhq\.com$/,
      title: ["h1", '[class*="_title"]'],
      company: () => titleCase(path[0] || ""),
      location: ['[class*="_location"]', '[class*="location"]'],
      description: ['[class*="_description"]', "#overview", "main"],
    },
    {
      test: /myworkdayjobs\.com$/,
      title: ['[data-automation-id="jobPostingHeader"]', "h1"],
      company: () => {
        const label = location.hostname.split(".")[0];
        return /^wd\d+$/i.test(label)
          ? titleCase(path[1] || path[0] || "")
          : titleCase(label);
      },
      location: [
        '[data-automation-id="locations"] dd',
        '[data-automation-id="jobPostingLocation"]',
        '[data-automation-id="locations"]',
      ],
      description: ['[data-automation-id="jobPostingDescription"]'],
      employmentType: [
        '[data-automation-id="time"] dd',
        '[data-automation-id="jobPostingJobType"]',
      ],
    },
    {
      test: /workable\.com$/,
      title: ['[data-ui="job-title"]', "h1"],
      company: ['[data-ui="company-name"]', ".company-title"],
      location: ['[data-ui="job-location"]', '[data-ui="locations-container"]'],
      description: ['[data-ui="job-description"]', '[data-ui="overview"]'],
      employmentType: ['[data-ui="job-type"]'],
    },
    {
      test: /smartrecruiters\.com$/,
      title: ['[itemprop="title"]', "h1.job-title", "h1"],
      company: ['[itemprop="hiringOrganization"]', ".company-name"],
      location: ['[itemprop="jobLocation"]', "spl-job-location", ".job-location"],
      description: ['[itemprop="description"]', ".job-sections"],
      employmentType: ['[itemprop="employmentType"]'],
    },
    {
      test: /glassdoor\./,
      title: ['[data-test="job-title"]', "h1"],
      company: ['[data-test="employer-name"]', '[class*="EmployerProfile_name"]'],
      location: ['[data-test="location"]', '[class*="JobDetails_location"]'],
      description: [
        '[class*="JobDetails_jobDescription"]',
        "#JobDescriptionContainer",
      ],
    },
    {
      test: /seek\./,
      title: ['[data-automation="job-detail-title"]', "h1"],
      company: ['[data-automation="advertiser-name"]'],
      location: ['[data-automation="job-detail-location"]'],
      description: ['[data-automation="jobAdDetails"]'],
      employmentType: ['[data-automation="job-detail-work-type"]'],
    },
    {
      test: /wellfound\.com$/,
      title: ['[class*="job-title"]', "h1", "h2"],
      company: ['[class*="company-name"]', 'a[href^="/company/"]'],
      location: ['[class*="location"]'],
      description: ['[class*="job-description"]', "main"],
    },
    {
      test: /workatastartup\.com$/,
      title: ["h1", ".company-title"],
      company: [".company-name", 'a[href*="/companies/"]'],
      location: ['[class*="location"]'],
      description: [".prose", "main"],
    },
  ];

  const config = SITES.find((site) => site.test.test(location.hostname));

  const fromConfig = (field: keyof SiteConfig): string => {
    const value = config?.[field];
    try {
      if (typeof value === "function") return clean(String(value() || ""));
      if (Array.isArray(value)) return pick(value);
    } catch {
      return "";
    }
    return "";
  };

  /* ---- schema.org JobPosting (used by most boards) ---- */

  const findJobPosting = (): any => {
    const scripts = Array.from(
      document.querySelectorAll('script[type="application/ld+json"]')
    );
    for (const script of scripts) {
      let parsed: any;
      try {
        parsed = JSON.parse(script.textContent || "");
      } catch {
        continue;
      }
      const stack: any[] = [parsed];
      let guard = 0;
      while (stack.length && guard++ < 500) {
        const node = stack.pop();
        if (!node || typeof node !== "object") continue;
        if (Array.isArray(node)) {
          stack.push(...node);
          continue;
        }
        if (node["@graph"]) stack.push(node["@graph"]);
        const type = node["@type"];
        const types = Array.isArray(type) ? type : [type];
        if (types.indexOf("JobPosting") !== -1) return node;
      }
    }
    return null;
  };

  const addressText = (value: any): string => {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (Array.isArray(value))
      return value.map(addressText).filter(Boolean).join(" / ");
    if (value.address) return addressText(value.address);
    const parts = [value.addressLocality, value.addressRegion, value.addressCountry]
      .map((part: any) => (part && typeof part === "object" ? part.name : part))
      .filter(Boolean);
    if (parts.length) return parts.join(", ");
    return value.name ? String(value.name) : "";
  };

  const salaryText = (posting: any): string => {
    const base = posting?.baseSalary;
    if (!base) return "";
    if (typeof base === "string" || typeof base === "number") return `Salary: ${base}`;
    const value = base.value || base;
    const currency = base.currency || value.currency || "";
    const unit = value.unitText ? ` per ${String(value.unitText).toLowerCase()}` : "";
    const amount =
      value.value != null
        ? String(value.value)
        : value.minValue != null && value.maxValue != null
        ? `${value.minValue} - ${value.maxValue}`
        : value.minValue != null
        ? `${value.minValue}+`
        : value.maxValue != null
        ? `up to ${value.maxValue}`
        : "";
    return amount ? clean(`Salary: ${currency} ${amount}${unit}`) : "";
  };

  const posting = findJobPosting();

  const jsonTitle = posting?.title ? clean(String(posting.title)) : "";
  const jsonCompany =
    typeof posting?.hiringOrganization === "string"
      ? clean(posting.hiringOrganization)
      : posting?.hiringOrganization?.name
      ? clean(String(posting.hiringOrganization.name))
      : "";
  const remote =
    posting?.jobLocationType === "TELECOMMUTE" ||
    /telecommute/i.test(String(posting?.jobLocationType || ""));
  const jsonLocation = first(
    addressText(posting?.jobLocation),
    addressText(posting?.applicantLocationRequirements),
    remote ? "Remote" : ""
  );
  const jsonDescription = posting?.description
    ? htmlToText(String(posting.description))
    : "";
  const jsonType = Array.isArray(posting?.employmentType)
    ? posting.employmentType.join(" ")
    : String(posting?.employmentType || "");

  /* ---- generic fallbacks ---- */

  const documentTitle = clean(document.title || "").split(/\s+[|–—]\s+/)[0];

  const genericTitle = first(
    metaContent(["og:title", "twitter:title"]),
    readNode(document.querySelector("h1")),
    documentTitle
  );

  const genericCompany = first(
    metaContent(["og:site_name", "application-name"]),
    titleCase(location.hostname.replace(/^www\./, "").split(".")[0])
  );

  const genericDescription = first(
    pick(["article", "main"]),
    metaContent(["og:description", "description"])
  );

  /* ---- assemble ---- */

  const buildLink = (): string => {
    const raw = first(
      config?.link ? config.link() : "",
      document.querySelector('link[rel="canonical"]')?.getAttribute("href") || "",
      metaContent(["og:url"]),
      location.href
    );
    try {
      const url = new URL(raw, location.href);
      const junk = [
        /^utm_/i,
        /^gh_src$/i,
        /^ref$/i,
        /^refId$/i,
        /^trk$/i,
        /^trackingId$/i,
        /^eBP$/i,
        /^origin$/i,
        /^position$/i,
        /^pageNum$/i,
        /^alid$/i,
        /^from$/i,
        /^source$/i,
        /^src$/i,
        /^fbclid$/i,
        /^gclid$/i,
      ];
      for (const key of Array.from(url.searchParams.keys())) {
        if (junk.some((rule) => rule.test(key))) url.searchParams.delete(key);
      }
      return url.toString();
    } catch {
      return location.href;
    }
  };

  const extras: string[] = [];
  const salary = salaryText(posting);
  if (salary) extras.push(salary);
  if (posting?.datePosted)
    extras.push(`Posted: ${String(posting.datePosted).slice(0, 10)}`);
  if (remote) extras.push("Remote role");

  let description = first(
    fromConfig("description"),
    jsonDescription,
    genericDescription
  );
  if (description.length > MAX_DESCRIPTION) {
    description = `${description.slice(0, MAX_DESCRIPTION).trim()}…`;
  }

  return {
    title: first(fromConfig("title"), jsonTitle, genericTitle),
    company: first(fromConfig("company"), jsonCompany, genericCompany),
    location: first(fromConfig("location"), jsonLocation),
    link: buildLink(),
    description,
    employmentType: normaliseType(
      first(fromConfig("employmentType"), jsonType)
    ),
    extraDetails: extras.join("\n"),
    site: location.hostname.replace(/^www\./, ""),
    matched: Boolean(config || posting),
  };
}

const score = (job: any): number =>
  ["title", "company", "location", "description"].reduce(
    (total, key) => total + (job && job[key] ? 1 : 0),
    0
  );

/** Scrapes the tab the user is currently looking at. */
export async function scrapeActiveTab(): Promise<ScrapeResult> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab?.id || !tab.url) return { ok: false, reason: "No active tab." };
  if (!/^https?:/i.test(tab.url)) {
    return { ok: false, reason: "This page can't be read." };
  }

  let frames;
  try {
    frames = await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      func: pageScraper,
    });
  } catch {
    try {
      frames = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: pageScraper,
      });
    } catch {
      const host = (() => {
        try {
          return new URL(tab.url!).hostname;
        } catch {
          return "this site";
        }
      })();
      return {
        ok: false,
        reason: `No access to ${host} - add it to host_permissions in manifest.json.`,
      };
    }
  }

  // Embedded boards (Greenhouse/Lever in an iframe) live in a subframe, so keep
  // whichever frame produced the most complete posting.
  const best = frames
    .map((frame) => frame.result as any)
    .filter(Boolean)
    .sort((a, b) => score(b) - score(a))[0];

  if (!best || (!best.title && !best.company)) {
    return { ok: false, reason: "Couldn't find a job posting on this page." };
  }

  const { matched, ...job } = best;
  return { ok: true, job: job as ScrapedJob };
}
