import React from 'react';
import useTranslation from '../hooks/useTranslation';

export default function Footer() {
  const t = useTranslation();
  const githubUrl = process.env.REACT_APP_AUTHOR_URL;
  return (
    <div className="footer">
      <span>
        {t('footer.version')}: {process.env.REACT_APP_VERSION}
      </span>
      <span>
        {t('footer.author')}: {process.env.REACT_APP_AUTHOR} (
        <a
          href={githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            textDecoration: 'none',
            color: getComputedStyle(document.documentElement).getPropertyValue('--main-color-lighter')
          }}
        >
          {githubUrl}
        </a>
        )
      </span>
    </div>
  );
}
