import React from 'react';
import { Facebook, Instagram } from 'lucide-react';
import { BusinessSettings } from '../types';

interface SocialIconsProps {
  settings?: BusinessSettings;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showHandle?: boolean;
}

// Custom SVG for TikTok
const TikTokIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743 2.895 2.895 0 0 1 3.183-4.51v-3.5a6.329 6.329 0 0 0-5.394 2.38 6.39 6.39 0 0 0 1.088 8.663 6.393 6.393 0 0 0 8.768-.908 6.332 6.332 0 0 0 1.284-3.83V9.117a8.188 8.188 0 0 0 4.787 1.517v-3.47a4.84 4.84 0 0 1-1.302-.478z"/>
  </svg>
);

// Custom SVG for Snapchat
const SnapchatIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12.043 2.01c-3.15 0-5.54 2.227-5.54 5.372 0 .894.218 1.83.568 2.585-.306.082-.765.228-1.157.228-.62 0-.973-.243-1.291-.46-.174-.118-.344-.233-.585-.233-.314 0-.616.208-.616.593 0 .723.864 1.34 1.542 1.636.085.037.126.136.096.223-.11.316-.39.814-.863 1.026-.525.234-.99.073-1.31-.038a.222.222 0 0 0-.276.138c-.114.305-.042.693.183.993.308.412.91.68 1.488.68.22 0 .426-.037.616-.11.11-.043.23-.005.297.092.366.527 1.066.864 2.128.864.28 0 .57-.024.872-.082a.23.23 0 0 1 .267.165c.312 1.076 1.487 1.82 2.89 1.82 1.403 0 2.578-.744 2.89-1.82a.23.23 0 0 1 .267-.165c.303.058.593.082.872.082 1.062 0 1.762-.337 2.128-.864.067-.097.187-.135.297-.092.19.073.396.11.616.11.578 0 1.18-.268 1.488-.68.225-.3.297-.688.183-.993a.222.222 0 0 0-.276-.138c-.32.111-.785.272-1.31.038-.473-.212-.753-.71-.863-1.026a.222.222 0 0 1 .096-.223c.678-.296 1.542-.913 1.542-1.636 0-.385-.302-.593-.616-.593-.24 0-.41.115-.585.233-.318.217-.671.46-1.291.46-.392 0-.851-.146-1.157-.228.35-.755.568-1.691.568-2.585 0-3.145-2.39-5.372-5.54-5.372z"/>
  </svg>
);

export const SocialIcons: React.FC<SocialIconsProps> = ({
  settings,
  size = 'md',
  className = '',
  showHandle = true,
}) => {
  const handle = settings?.socialHandle || '@Munachiama.ng';

  const facebookUrl = settings?.facebook && settings.facebook.trim() ? settings.facebook : '#';
  const instagramUrl = settings?.instagram && settings.instagram.trim() ? settings.instagram : '#';
  const tiktokUrl = settings?.tiktok && settings.tiktok.trim() ? settings.tiktok : '#';
  const snapchatUrl = settings?.snapchat && settings.snapchat.trim() ? settings.snapchat : '#';

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const socialLinks = [
    {
      name: 'Facebook',
      url: facebookUrl,
      icon: <Facebook className={iconSizes[size]} />,
      label: 'Visit Munachiama on Facebook',
    },
    {
      name: 'Instagram',
      url: instagramUrl,
      icon: <Instagram className={iconSizes[size]} />,
      label: 'Follow Munachiama on Instagram',
    },
    {
      name: 'TikTok',
      url: tiktokUrl,
      icon: <TikTokIcon className={iconSizes[size]} />,
      label: 'Follow Munachiama on TikTok',
    },
    {
      name: 'Snapchat',
      url: snapchatUrl,
      icon: <SnapchatIcon className={iconSizes[size]} />,
      label: 'Follow Munachiama on Snapchat',
    },
  ];

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {showHandle && (
        <div className="flex items-center gap-2 text-[#D4AF37] font-semibold text-xs tracking-wider">
          <span className="px-2.5 py-1 rounded-full bg-[#3D0C11] border border-[#D4AF37]/30">
            {handle}
          </span>
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        {socialLinks.map((item) => (
          <a
            key={item.name}
            href={item.url !== '#' ? item.url : undefined}
            onClick={(e) => {
              if (item.url === '#') {
                e.preventDefault();
                alert(`The official ${item.name} URL for ${handle} can be configured in the Admin Dashboard under Business Settings.`);
              }
            }}
            target={item.url !== '#' ? '_blank' : undefined}
            rel={item.url !== '#' ? 'noopener noreferrer' : undefined}
            aria-label={item.label}
            title={item.label}
            className={`${sizeClasses[size]} rounded-full bg-[#3D0C11] text-[#D4AF37] border border-[#D4AF37]/40 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:bg-[#D4AF37] hover:text-[#3D0C11] hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] group cursor-pointer`}
          >
            {item.icon}
          </a>
        ))}
      </div>
    </div>
  );
};
