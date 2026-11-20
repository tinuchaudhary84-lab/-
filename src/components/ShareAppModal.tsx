import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  Check,
  Copy,
  MessageCircle,
  QrCode,
  Share2,
  ShieldCheck,
  X,
} from 'lucide-react';
import { TranslationStrings } from '../i18n/translations';

interface ShareAppModalProps {
  isOpen: boolean;
  t: TranslationStrings;
  onClose: () => void;
  onNotify: (msg: string) => void;
}

export function getShareableAppUrl(): string {
  if (typeof window === 'undefined') return '';
  const { origin, pathname } = window.location;
  const shareOrigin = origin.replace('://ais-dev-', '://ais-pre-');
  return `${shareOrigin}${pathname === '/' ? '' : pathname}`;
}

async function copyTextSafely(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fallback below
  }
  try {
    const el = document.createElement('textarea');
    el.value = text;
    el.setAttribute('readonly', '');
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
}

export const ShareAppModal: React.FC<ShareAppModalProps> = ({
  isOpen,
  t,
  onClose,
  onNotify,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const shareUrl = getShareableAppUrl();

  useEffect(() => {
    if (!isOpen || !shareUrl) return;
    let active = true;
    void QRCode.toDataURL(shareUrl, {
      width: 220,
      margin: 2,
      color: {
        dark: '#0F172A',
        light: '#FFFFFF',
      },
    })
      .then((url) => {
        if (active) setQrDataUrl(url);
      })
      .catch(() => {
        if (active) setQrDataUrl('');
      });
    return () => {
      active = false;
    };
  }, [isOpen, shareUrl]);

  if (!isOpen) return null;

  const fullShareText = `${t.shareMessageText}\n${shareUrl}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(fullShareText)}`;
  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const handleCopy = async () => {
    const ok = await copyTextSafely(shareUrl);
    if (ok) {
      setCopied(true);
      onNotify(t.linkCopied);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNativeShare = async () => {
    if (canNativeShare) {
      try {
        await navigator.share({
          title: t.appName,
          text: t.shareMessageText,
          url: shareUrl,
        });
        return;
      } catch {
        // User cancelled or iframe blocked navigator.share — fallback to copy
      }
    }
    await handleCopy();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xl space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shrink-0">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {t.shareWithFriends}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t.shareWithFriendsDesc}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="min-w-[36px] min-h-[36px] rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Privacy Notice */}
        <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 p-3.5 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-xs font-medium text-emerald-900 dark:text-emerald-200 leading-relaxed">
            {t.sharePrivacyNote}
          </p>
        </div>

        {/* QR Code Card for Instant Mobile Scan */}
        <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/70 p-4 flex flex-col items-center text-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-white shadow-xs border border-slate-200">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={t.scanQrToOpen}
                className="w-40 h-40 block"
              />
            ) : (
              <div className="w-40 h-40 flex items-center justify-center text-slate-400">
                <QrCode className="w-12 h-12" />
              </div>
            )}
          </div>
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {t.scanQrToOpen}
          </p>
        </div>

        {/* Shareable Link Box */}
        <div className="flex items-center gap-2 p-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <input
            type="text"
            readOnly
            value={shareUrl}
            onClick={(e) => (e.target as HTMLInputElement).select()}
            className="flex-1 bg-transparent px-2 text-xs font-mono text-slate-700 dark:text-slate-200 focus:outline-none truncate"
          />
          <button
            type="button"
            onClick={() => void handleCopy()}
            className="h-9 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span>{copied ? t.linkCopied : t.copyAppLink}</span>
          </button>
        </div>

        {/* Action Buttons: WhatsApp + Mobile Share */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="h-11 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{t.shareViaWhatsapp}</span>
          </a>

          <button
            type="button"
            onClick={() => void handleNativeShare()}
            className="h-11 px-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <Share2 className="w-4 h-4" />
            <span>{t.shareNow}</span>
          </button>
        </div>

        {/* Friend Setup Steps */}
        <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/70 p-4 text-xs sm:text-sm space-y-1.5">
          <p className="font-bold text-slate-900 dark:text-white">{t.friendStepsTitle}</p>
          <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-300 leading-relaxed">
            <li>{t.friendStep1}</li>
            <li>{t.friendStep2}</li>
          </ol>
        </div>
      </div>
    </div>
  );
};
