import React from 'react';

/**
 * SEO Head component — sets document title and meta tags dynamically.
 * Usage: <SEO title="Towsif Islam — Tivora" description="View Towsif Islam's profile on Tivora." />
 */
export default function SEO({ title, description, imageURL, url, type = 'website' }) {
  const DEFAULT_TITLE = 'Tivora — Connect · Share · Grow Together';
  const DEFAULT_DESCRIPTION = 'Tivora is a modern social platform to connect with friends, share posts, join communities, and grow together.';
  const DEFAULT_IMAGE = 'https://tivora.app/og-image.png';
  const DEFAULT_URL = 'https://tivora.app';

  const resolvedTitle = title ? `${title} — Tivora` : DEFAULT_TITLE;
  const resolvedDescription = description || DEFAULT_DESCRIPTION;
  const resolvedImage = imageURL || DEFAULT_IMAGE;
  const resolvedURL = url || DEFAULT_URL;

  React.useEffect(() => {
    // Document Title
    document.title = resolvedTitle;

    // Description
    setMeta('name', 'description', resolvedDescription);

    // Open Graph
    setMeta('property', 'og:title', resolvedTitle);
    setMeta('property', 'og:description', resolvedDescription);
    setMeta('property', 'og:image', resolvedImage);
    setMeta('property', 'og:url', resolvedURL);
    setMeta('property', 'og:type', type);

    // Twitter Card
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', resolvedTitle);
    setMeta('name', 'twitter:description', resolvedDescription);
    setMeta('name', 'twitter:image', resolvedImage);

    return () => {
      // Reset on unmount to avoid stale metadata
      document.title = DEFAULT_TITLE;
    };
  }, [resolvedTitle, resolvedDescription, resolvedImage, resolvedURL, type]);

  return null;
}

function setMeta(attrKey, attrValue, content) {
  let el = document.querySelector(`meta[${attrKey}="${attrValue}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrKey, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}
