import { useState } from 'react'

interface BrandLogoProps {
  src?:   string | null
  alt?:   string
  size?:  number
  style?: React.CSSProperties
}

/** Fallback SVG — brand logo yuklanmagan yoki yo'q bo'lsa ko'rsatiladi */
function FallbackSvg({ size, style }: { size: number; style?: React.CSSProperties }) {
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 32 32" fill="none"
      style={{ flexShrink: 0, ...style }}
    >
      <rect width="32" height="32" rx="8" fill="#1677ff" />
      <path
        d="M8 22 L16 10 L24 22"
        stroke="white" strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round"
      />
      <circle cx="16" cy="10" r="2" fill="white" />
    </svg>
  )
}

/**
 * Brand logo rasmi. src yo'q yoki rasm yuklanmasa — fallback SVG ko'rsatiladi.
 */
export function BrandLogo({ src, alt = '', size = 32, style }: BrandLogoProps) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) return <FallbackSvg size={size} style={style} />

  return (
    <img
      src={src}
      alt={alt}
      style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0, ...style }}
      onError={() => setFailed(true)}
    />
  )
}
