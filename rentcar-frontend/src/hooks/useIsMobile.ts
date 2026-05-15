import { Grid } from 'antd'

const { useBreakpoint } = Grid

/** Returns true when viewport width < 768px (Ant Design md breakpoint) */
export function useIsMobile(): boolean {
  const screens = useBreakpoint()
  return !screens.md
}
