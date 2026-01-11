export type PolicyType = 'privacy' | 'refund' | 'returns' | 'delivery' | 'terms';

export interface PolicyLink {
  type: PolicyType;
  title: string;
  url: string;
  slug: string;
}

const DEFAULT_SLUGS: Record<PolicyType, string> = {
  privacy: 'privacy-policy.html',
  refund: 'refund-policy.html',
  returns: 'return-policy.html',
  delivery: 'delivery-policy.html',
  terms: 'terms-and-conditions.html',
};

const DEFAULT_TITLES: Record<PolicyType, string> = {
  privacy: 'Privacy Policy',
  refund: 'Refund Policy',
  returns: 'Return Policy',
  delivery: 'Delivery Policy',
  terms: 'Terms and Conditions',
};

/**
 * Generate policy sample document links in the format PayHere expects.
 * Defaults to the current site origin + standard slugs.
 *
 * Example output:
 * [
 *   { type: 'privacy', title: 'Privacy Policy', url: 'https://your-domain.com/privacy-policy', slug: 'privacy-policy' },
 *   { type: 'refund', title: 'Refund Policy', url: 'https://your-domain.com/refund-policy', slug: 'refund-policy' },
 *   ...
 * ]
 */
export function getPolicyLinks(baseUrl?: string): PolicyLink[] {
  const origin = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');

  const types: PolicyType[] = ['privacy', 'refund', 'returns', 'delivery', 'terms'];

  return types.map((type) => {
    const slug = DEFAULT_SLUGS[type];
    const title = DEFAULT_TITLES[type];
    const url = origin ? `${origin}/${slug}` : `/${slug}`;
    return { type, title, url, slug };
  });
}

/** Convenience: return a mapped object {privacy, refund, returns, delivery, terms} */
export function getPolicyMap(baseUrl?: string): Record<PolicyType, PolicyLink> {
  const links = getPolicyLinks(baseUrl);
  return links.reduce((acc, link) => {
    acc[link.type] = link;
    return acc;
  }, {} as Record<PolicyType, PolicyLink>);
}
