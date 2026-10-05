import React, { useEffect } from 'react';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

interface SEOHeadProps {
  title: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogUrl?: string;
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description,
  keywords,
  ogImage,
  ogUrl,
}) => {
  useDocumentTitle(title);

  useEffect(() => {
    const setMetaTag = (attrName: string, attrValue: string, content: string) => {
      let element = document.querySelector(`meta[${attrName}="${attrValue}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attrName, attrValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
      return element;
    };

    const elementsToCleanup: Element[] = [];

    if (description) {
      elementsToCleanup.push(setMetaTag('name', 'description', description));
      elementsToCleanup.push(setMetaTag('property', 'og:description', description));
      elementsToCleanup.push(setMetaTag('name', 'twitter:description', description));
    }

    if (keywords) {
      elementsToCleanup.push(setMetaTag('name', 'keywords', keywords));
    }

    elementsToCleanup.push(setMetaTag('property', 'og:title', title));
    elementsToCleanup.push(setMetaTag('name', 'twitter:title', title));

    if (ogImage) {
      elementsToCleanup.push(setMetaTag('property', 'og:image', ogImage));
      elementsToCleanup.push(setMetaTag('name', 'twitter:image', ogImage));
    }

    if (ogUrl) {
      elementsToCleanup.push(setMetaTag('property', 'og:url', ogUrl));
    }

    return () => {
      // We don't remove elements to avoid thrashing, but we could reset them.
      // In a SPA, meta tags usually just get updated by the next page.
    };
  }, [title, description, keywords, ogImage, ogUrl]);

  return null;
};
