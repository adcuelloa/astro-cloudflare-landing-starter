const DEFAULT_FORMAT = "webp";
const DEFAULT_METADATA = "none";
const DEFAULT_FIT = "cover";

function stringSource(src) {
  if (typeof src === "string") {
    return src;
  }

  return src.src;
}

function cloudflareOptionPairs(options, config) {
  const pairs = [];

  if (options.width) {
    pairs.push(["width", options.width]);
  }

  if (options.height) {
    pairs.push(["height", options.height]);
  }

  pairs.push(["fit", options.fit ?? config.defaultFit ?? DEFAULT_FIT]);
  pairs.push(["quality", options.quality ?? config.defaultQuality ?? 82]);
  pairs.push(["format", options.format ?? config.defaultFormat ?? DEFAULT_FORMAT]);
  pairs.push(["metadata", config.metadata ?? DEFAULT_METADATA]);

  if (config.onerror) {
    pairs.push(["onerror", config.onerror]);
  }

  return pairs.map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`).join(",");
}

function cloudflareImageURL(options, config) {
  const baseUrl = (config.baseUrl ?? "").replace(/\/+$/, "");
  const source = stringSource(options.src);
  const encodedSource = source.startsWith("/") ? source : encodeURI(source);
  const params = cloudflareOptionPairs(options, config);

  return `${baseUrl}/cdn-cgi/image/${params}/${encodedSource}`;
}

function targetDimensions(options) {
  const width = Number(options.width);
  const height = Number(options.height);

  if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
    return { width, height };
  }

  return { width: options.width, height: options.height };
}

function srcSetValues(options) {
  const widths = [...(options.widths ?? [])].sort((a, b) => a - b);
  const { width, height } = targetDimensions(options);

  if (widths.length === 0 || typeof width !== "number" || typeof height !== "number") {
    return [];
  }

  const aspectRatio = width / height;

  return Array.from(new Set(widths)).map((srcSetWidth) => ({
    transform: {
      ...options,
      width: srcSetWidth,
      height: Math.round(srcSetWidth / aspectRatio),
    },
    descriptor: `${srcSetWidth}w`,
    attributes: {
      type: `image/${options.format ?? DEFAULT_FORMAT}`,
    },
  }));
}

const service = {
  getURL(options, imageConfig) {
    return cloudflareImageURL(options, imageConfig.service.config);
  },

  getSrcSet(options) {
    return srcSetValues(options);
  },

  getHTMLAttributes(options) {
    const attributes = { ...options };
    const dimensions = targetDimensions(options);

    delete attributes.src;
    delete attributes.width;
    delete attributes.height;
    delete attributes.format;
    delete attributes.quality;
    delete attributes.widths;
    delete attributes.densities;
    delete attributes.layout;
    delete attributes.priority;
    delete attributes.fit;
    delete attributes.position;
    delete attributes.background;

    return {
      ...attributes,
      width: dimensions.width,
      height: dimensions.height,
      loading: attributes.loading ?? "lazy",
      decoding: attributes.decoding ?? "async",
    };
  },
};

export default service;
