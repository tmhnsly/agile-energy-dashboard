import type { ReactNode } from 'react';
import {
  TbTriangleFilled,
  TbTriangleInvertedFilled,
  TbArrowBigUpFilled,
  TbArrowBigDownFilled,
  TbCalculatorFilled,
  TbClockFilled,
  TbBoltFilled,
  TbFlameFilled,
  TbSnowflake,
  TbCirclePercentageFilled,
} from 'react-icons/tb';

/** Curated icon set for StatCard stories and controls. */
export const STAT_CARD_ICONS: Record<string, ReactNode> = {
  None: undefined,
  Up: <TbTriangleFilled />,
  Down: <TbTriangleInvertedFilled />,
  'Arrow Up': <TbArrowBigUpFilled />,
  'Arrow Down': <TbArrowBigDownFilled />,
  Calculator: <TbCalculatorFilled />,
  Clock: <TbClockFilled />,
  Energy: <TbBoltFilled />,
  Flame: <TbFlameFilled />,
  Snowflake: <TbSnowflake />,
  Percentage: <TbCirclePercentageFilled />,
};
