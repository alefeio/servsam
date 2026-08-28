export const brandAssets = {
  logoHorizontal: {
    src: "/brand/logo-servsam-horizontal.png",
    width: 309,
    height: 79,
  },
  logoVertical: {
    src: "/brand/logo-servsam-vertical.png",
    width: 200,
    height: 186,
  },
} as const;

export function getBrandLogoDimensions(
  variant: "horizontal" | "vertical",
  displayHeight: number,
) {
  const asset =
    variant === "horizontal"
      ? brandAssets.logoHorizontal
      : brandAssets.logoVertical;

  return {
    width: Math.round(asset.width * (displayHeight / asset.height)),
    height: displayHeight,
  };
}
