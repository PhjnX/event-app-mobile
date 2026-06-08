import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  StyleSheet,
  Share,
  Linking,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { VideoView, useVideoPlayer } from "expo-video";
import { useAppDispatch, useAppSelector } from "../../hooks/useRedux";
import {
  fetchPostDetail,
  clearPostDetail,
  fetchPosts,
} from "../../store/slices/newsSlice";

const DOMAIN = "https://ems.webie.com.vn";
const LOGO = require("../../../assets/Logo_EMS.webp");

const C = {
  gold: "#D8C97B",
  goldDim: "rgba(216,201,123,0.10)",
  goldBorder: "rgba(216,201,123,0.25)",
  bg: "#0a0a0a",
  bgCard: "#111111",
  white: "#ffffff",
  textBody: "#bbbbbb",
  gray: "#888888",
  muted: "#555555",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const isVideoUrl = (url?: string | null): boolean => {
  if (!url) return false;
  return /\.(mp4|webm|mov|ogg)(\?.*)?$/i.test(url.split("?")[0]);
};

const formatDate = (dateString: string) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatDateShort = (dateString: string) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const sanitizeText = (text: string) =>
  (text || "").replace(/\n+/g, " ").replace(/  +/g, " ").trim();

const stripHtml = (html: string) =>
  (html || "")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#160;/g, " ")
    .replace(/\u00a0/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();

// ─── HeroMedia: Image or Video for hero ──────────────────────────────────────
const HeroMedia = ({ uri }: { uri?: string | null }) => {
  const fallback = "https://placehold.co/600x400/111/333?text=News";
  const player = useVideoPlayer(isVideoUrl(uri) && uri ? uri : "", (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  if (isVideoUrl(uri) && uri) {
    return (
      <>
        <VideoView
          player={player}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
          nativeControls={false}
        />
        <View style={ss.videoBadge}>
          <Ionicons name="play-circle" size={13} color={C.gold} />
          <Text style={ss.videoBadgeText}>VIDEO</Text>
        </View>
      </>
    );
  }
  return (
    <Image
      source={{ uri: uri || fallback }}
      style={StyleSheet.absoluteFillObject}
      resizeMode="cover"
    />
  );
};

// ─── InlineText ───────────────────────────────────────────────────────────────
const InlineText = ({ html, style }: { html: string; style?: any }) => {
  const segments: {
    text: string;
    bold?: boolean;
    italic?: boolean;
    mark?: boolean;
  }[] = [];
  const regex =
    /<b>(.*?)<\/b>|<strong>(.*?)<\/strong>|<i>(.*?)<\/i>|<em>(.*?)<\/em>|<mark[^>]*>(.*?)<\/mark>|([^<]+)/gs;
  const clean = sanitizeText(html || "").replace(
    /<(?!\/?(b|strong|i|em|mark)[ >])[^>]*>/g,
    "",
  );
  let match;
  while ((match = regex.exec(clean)) !== null) {
    if (match[1] !== undefined || match[2] !== undefined)
      segments.push({ text: match[1] ?? match[2], bold: true });
    else if (match[3] !== undefined || match[4] !== undefined)
      segments.push({ text: match[3] ?? match[4], italic: true });
    else if (match[5] !== undefined)
      segments.push({ text: match[5], mark: true });
    else if (match[6] !== undefined) segments.push({ text: match[6] });
  }
  if (segments.length === 0)
    return <Text style={style}>{sanitizeText(stripHtml(html))}</Text>;
  return (
    <Text style={style}>
      {segments.map((seg, i) => (
        <Text
          key={i}
          style={[
            seg.bold && { fontWeight: "800", color: "#fff" },
            seg.italic && { fontStyle: "italic" },
            seg.mark && { color: C.gold, fontWeight: "700" },
          ]}
        >
          {sanitizeText(seg.text)}
        </Text>
      ))}
    </Text>
  );
};

// ─── BlockImage: supports video files from EditorJS image blocks ──────────────
const BlockImage = ({ url, caption }: { url: string; caption?: string }) => {
  const isVideo = isVideoUrl(url);
  const player = useVideoPlayer(isVideo ? url : "", (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  return (
    <View style={ss.blockImgWrap}>
      {isVideo ? (
        <VideoView
          player={player}
          style={{ width: "100%", height: 220 }}
          contentFit="cover"
          nativeControls={false}
        />
      ) : (
        <Image
          source={{ uri: url }}
          style={{ width: "100%", height: 220 }}
          resizeMode="cover"
        />
      )}
      {isVideo && (
        <View
          style={[
            ss.videoBadge,
            { top: 10, left: 10, right: undefined, bottom: undefined },
          ]}
        >
          <Ionicons name="play-circle" size={13} color={C.gold} />
          <Text style={ss.videoBadgeText}>VIDEO</Text>
        </View>
      )}
      {caption ? (
        <View
          style={{
            backgroundColor: "#111",
            paddingHorizontal: 12,
            paddingVertical: 8,
          }}
        >
          <Text
            style={{
              color: C.muted,
              fontSize: 12,
              fontStyle: "italic",
              textAlign: "center",
            }}
          >
            {stripHtml(caption)}
          </Text>
        </View>
      ) : null}
    </View>
  );
};

// ─── renderBlock ──────────────────────────────────────────────────────────────
const renderBlock = (block: any, index: number) => {
  const { type, data } = block;

  switch (type) {
    case "header": {
      const level = data?.level || 2;
      if (level <= 2) {
        return (
          <View
            key={index}
            style={{
              borderLeftWidth: 3,
              borderLeftColor: C.gold,
              paddingLeft: 12,
              marginTop: 20,
              marginBottom: 4,
            }}
          >
            <InlineText
              html={data?.text || ""}
              style={{
                color: C.white,
                fontSize: level === 1 ? 24 : 20,
                fontWeight: "800",
                letterSpacing: -0.5,
                lineHeight: level === 1 ? 32 : 28,
              }}
            />
          </View>
        );
      }
      if (level === 3) {
        return (
          <View key={index} style={{ marginTop: 16, marginBottom: 4 }}>
            <InlineText
              html={data?.text || ""}
              style={{
                color: "#dddddd",
                fontSize: 17,
                fontWeight: "700",
                letterSpacing: -0.3,
                lineHeight: 24,
              }}
            />
          </View>
        );
      }
      return (
        <View key={index} style={{ marginTop: 12, marginBottom: 4 }}>
          <InlineText
            html={data?.text || ""}
            style={{
              color: "#aaaaaa",
              fontSize: level === 4 ? 15 : 13,
              fontWeight: "700",
              lineHeight: 20,
            }}
          />
        </View>
      );
    }

    case "paragraph": {
      const text = data?.text || "";
      if (!stripHtml(text)) return null;
      return (
        <View key={index} style={{ marginBottom: 12 }}>
          <InlineText
            html={text}
            style={{ color: C.textBody, fontSize: 15, lineHeight: 26 }}
          />
        </View>
      );
    }

    case "list": {
      const items: any[] = data?.items || [];
      const ordered = data?.style === "ordered";
      return (
        <View key={index} style={{ marginBottom: 16 }}>
          {items.map((item: any, i: number) => {
            const html =
              typeof item === "string" ? item : item.content || item.text || "";
            return (
              <View
                key={i}
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  marginBottom: 8,
                }}
              >
                {ordered ? (
                  <View style={ss.orderedBullet}>
                    <Text
                      style={{ color: C.gold, fontSize: 11, fontWeight: "800" }}
                    >
                      {i + 1}
                    </Text>
                  </View>
                ) : (
                  <View style={ss.unorderedBullet} />
                )}
                <InlineText
                  html={html}
                  style={{
                    color: C.textBody,
                    fontSize: 15,
                    lineHeight: 26,
                    flex: 1,
                  }}
                />
              </View>
            );
          })}
        </View>
      );
    }

    case "image": {
      const url = data?.file?.url || data?.url || "";
      if (!url) return null;
      return <BlockImage key={index} url={url} caption={data?.caption} />;
    }

    case "quote":
      return (
        <View
          key={index}
          style={{
            backgroundColor: "#111",
            borderColor: "rgba(216,201,123,0.15)",
            borderWidth: 1,
            borderRadius: 16,
            padding: 20,
            marginBottom: 16,
          }}
        >
          <MaterialCommunityIcons
            name="format-quote-open"
            size={24}
            color={C.gold}
            style={{ opacity: 0.5, marginBottom: 6 }}
          />
          <InlineText
            html={data?.text || ""}
            style={{
              color: "#cccccc",
              fontSize: 15,
              fontStyle: "italic",
              lineHeight: 26,
            }}
          />
          {data?.caption ? (
            <Text
              style={{
                color: C.gold,
                fontSize: 12,
                fontWeight: "700",
                marginTop: 8,
              }}
            >
              — {stripHtml(data.caption)}
            </Text>
          ) : null}
        </View>
      );

    case "delimiter":
      return <DiamondDivider key={index} />;

    case "warning":
      return (
        <View
          key={index}
          style={{
            flexDirection: "row",
            backgroundColor: "rgba(216,201,123,0.07)",
            borderColor: C.goldBorder,
            borderWidth: 1,
            borderRadius: 12,
            padding: 14,
            marginBottom: 16,
          }}
        >
          <Ionicons
            name="warning-outline"
            size={18}
            color={C.gold}
            style={{ marginRight: 10, marginTop: 2 }}
          />
          <View style={{ flex: 1 }}>
            {data?.title ? (
              <Text
                style={{
                  color: C.gold,
                  fontSize: 13,
                  fontWeight: "800",
                  marginBottom: 4,
                }}
              >
                {data.title}
              </Text>
            ) : null}
            <InlineText
              html={data?.message || ""}
              style={{ color: "#999", fontSize: 13, lineHeight: 20 }}
            />
          </View>
        </View>
      );

    case "table": {
      const rows: string[][] = data?.content || [];
      return (
        <View
          key={index}
          style={{
            marginBottom: 16,
            borderRadius: 12,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.07)",
          }}
        >
          {rows.map((row: string[], ri: number) => (
            <View
              key={ri}
              style={{
                flexDirection: "row",
                backgroundColor:
                  ri === 0
                    ? "rgba(216,201,123,0.10)"
                    : ri % 2 === 0
                      ? "#0e0e0e"
                      : "#111",
              }}
            >
              {row.map((cell: string, ci: number) => (
                <View
                  key={ci}
                  style={{
                    flex: 1,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    borderLeftWidth: ci > 0 ? 1 : 0,
                    borderLeftColor: "rgba(255,255,255,0.06)",
                  }}
                >
                  <Text
                    style={
                      ri === 0
                        ? { color: C.gold, fontSize: 13, fontWeight: "700" }
                        : { color: "#999", fontSize: 13, lineHeight: 18 }
                    }
                  >
                    {stripHtml(cell)}
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      );
    }

    default:
      return null;
  }
};

// ─── DiamondDivider ───────────────────────────────────────────────────────────
const DiamondDivider = () => (
  <View
    style={{
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginVertical: 20,
    }}
  >
    <View
      style={{ flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.06)" }}
    />
    <View style={ss.diamond} />
    <View
      style={{ flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.06)" }}
    />
  </View>
);

// ─── ReadingProgressBar ───────────────────────────────────────────────────────
const ReadingProgressBar = ({ progress }: { progress: number }) => (
  <View style={ss.progressBarBg}>
    <View style={[ss.progressBarFill, { width: `${progress * 100}%` }]} />
  </View>
);

// ─── ContactStrip ─────────────────────────────────────────────────────────────
const ContactStrip = () => (
  <View
    style={{
      borderLeftWidth: 2,
      borderLeftColor: C.goldBorder,
      paddingLeft: 16,
      paddingVertical: 4,
    }}
  >
    <Text
      style={{
        color: C.gold,
        fontSize: 10,
        fontWeight: "900",
        letterSpacing: 2.5,
        marginBottom: 12,
      }}
    >
      LIÊN HỆ
    </Text>
    <View style={{ gap: 14 }}>
      {[
        {
          icon: "call-outline",
          label: "0969 838 467",
          sub: "Huyen DANG",
          href: "tel:0969838467",
        },
        {
          icon: "mail-outline",
          label: "huyen.dang@webie.com.vn",
          sub: "Email",
          href: "mailto:huyen.dang@webie.com.vn",
        },
        {
          icon: "globe-outline",
          label: "webie.com.vn",
          sub: "Website",
          href: "https://webie.com.vn",
        },
      ].map((item) => (
        <TouchableOpacity
          key={item.href}
          style={{ flexDirection: "row", alignItems: "center" }}
          onPress={() => Linking.openURL(item.href)}
        >
          <Ionicons name={item.icon as any} size={14} color={C.gold} />
          <View style={{ marginLeft: 8 }}>
            <Text style={{ color: "#ddd", fontSize: 13, fontWeight: "600" }}>
              {item.label}
            </Text>
            <Text style={{ color: C.muted, fontSize: 11, marginTop: 1 }}>
              {item.sub}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

// ─── TagsRow ──────────────────────────────────────────────────────────────────
const TagsRow = ({ tags }: { tags: string[] }) => {
  if (!tags?.length) return null;
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        flexWrap: "wrap",
      }}
    >
      <Ionicons
        name="pricetag-outline"
        size={13}
        color={C.gold}
        style={{ marginRight: 8 }}
      />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, flex: 1 }}>
        {tags.map((tag) => (
          <View
            key={tag}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 100,
              backgroundColor: "rgba(255,255,255,0.04)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.08)",
            }}
          >
            <Text style={{ color: C.gray, fontSize: 11 }}>#{tag}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// ─── AuthorByline ─────────────────────────────────────────────────────────────
const AuthorByline = ({
  dateStr,
  onShare,
}: {
  dateStr: string;
  onShare: () => void;
}) => (
  <View
    style={{
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    }}
  >
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <View style={ss.authorLogoWrap}>
        <Image
          source={LOGO}
          style={{ width: "100%", height: "100%" }}
          resizeMode="contain"
        />
      </View>
      <View>
        <Text style={{ color: "#ddd", fontSize: 13, fontWeight: "700" }}>
          Webie Vietnam
        </Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
            marginTop: 2,
          }}
        >
          <Ionicons name="time-outline" size={11} color={C.gold} />
          <Text style={{ color: C.muted, fontSize: 11 }}>{dateStr}</Text>
        </View>
      </View>
    </View>
    <TouchableOpacity
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 100,
        borderWidth: 1,
        borderColor: C.goldBorder,
        backgroundColor: C.goldDim,
      }}
      onPress={onShare}
      activeOpacity={0.75}
    >
      <Ionicons name="share-social-outline" size={16} color={C.gold} />
      <Text style={{ color: C.gold, fontSize: 12, fontWeight: "700" }}>
        Chia sẻ
      </Text>
    </TouchableOpacity>
  </View>
);

// ─── RelatedPostCard ──────────────────────────────────────────────────────────
const RelatedPostCard = ({
  post,
  onPress,
}: {
  post: any;
  onPress: () => void;
}) => {
  const title = post?.translations?.vi?.title || post?.title || "Bài viết";
  const thumb =
    post?.thumbnailUrl || "https://placehold.co/400x225/111/333?text=News";
  const isVideo = isVideoUrl(thumb);
  const player = useVideoPlayer(isVideo ? thumb : "", (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  return (
    <TouchableOpacity
      style={[
        ss.relCard,
        { backgroundColor: C.bgCard, borderColor: "rgba(255,255,255,0.07)" },
      ]}
      onPress={onPress}
      activeOpacity={0.82}
    >
      <View style={ss.relThumbWrap}>
        {isVideo ? (
          <VideoView
            player={player}
            style={StyleSheet.absoluteFillObject}
            contentFit="cover"
            nativeControls={false}
          />
        ) : (
          <Image
            source={{ uri: thumb }}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
          />
        )}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.55)"]}
          style={StyleSheet.absoluteFillObject}
        />
        {isVideo && (
          <View
            style={[
              ss.videoBadge,
              { bottom: 6, right: 6, top: undefined, left: undefined },
            ]}
          >
            <Ionicons name="play" size={9} color="#000" />
            <Text style={ss.videoBadgeText}>VIDEO</Text>
          </View>
        )}
      </View>
      <View
        style={{
          flex: 1,
          paddingHorizontal: 14,
          paddingVertical: 12,
          justifyContent: "space-between",
        }}
      >
        <Text
          style={{
            color: "#ccc",
            fontSize: 13,
            fontWeight: "700",
            lineHeight: 19,
          }}
          numberOfLines={2}
        >
          {title}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <Ionicons name="calendar-outline" size={10} color={C.gold} />
          <Text style={{ color: C.muted, fontSize: 11, flex: 1 }}>
            {formatDateShort(post?.createdAt)}
          </Text>
          <View style={ss.relArrow}>
            <Ionicons name="arrow-forward" size={10} color={C.gold} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function NewsDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useAppDispatch();
  const { slug } = route.params || {};

  const newsState = useAppSelector((state: any) => state.news);
  const postDetail = newsState?.postDetail;
  const isLoading = newsState?.isLoading || false;
  const allPosts: any[] = newsState?.posts || newsState?.data || [];

  const [scrollProgress, setScrollProgress] = useState(0);
  const contentHeight = useRef(0);
  const scrollRef = useRef<ScrollView>(null);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      const visibleH = e.nativeEvent.layoutMeasurement.height;
      const total = contentHeight.current - visibleH;
      if (total > 0) setScrollProgress(Math.min(y / total, 1));
    },
    [],
  );

  useEffect(() => {
    setScrollProgress(0);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    if (slug) dispatch(fetchPostDetail({ slug, lang: "vi" }) as any);
    dispatch(fetchPosts({ lang: "vi" }) as any).catch(() => {});
    return () => {
      dispatch(clearPostDetail());
    };
  }, [slug]);

  const handleShare = useCallback(async () => {
    if (!postDetail) return;
    try {
      await Share.share({
        title: postDetail.title,
        message: `${postDetail.title}\n${DOMAIN}/news/${postDetail.slug || slug}`,
        url: `${DOMAIN}/news/${postDetail.slug || slug}`,
      });
    } catch {}
  }, [postDetail, slug]);

  const isStale = postDetail && postDetail.slug && postDetail.slug !== slug;

  if (isLoading || isStale || (!postDetail && slug)) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: C.bg,
        }}
      >
        <ActivityIndicator size="large" color={C.gold} />
      </View>
    );
  }

  if (!postDetail) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            margin: 20,
            width: 40,
            height: 40,
            borderRadius: 12,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#161616",
          }}
        >
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <Ionicons name="alert-circle-outline" size={52} color="#333" />
          <Text style={{ color: C.muted, fontSize: 15, marginTop: 12 }}>
            Không tìm thấy bài viết
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  let blocks: any[] = [];
  try {
    const parsed = JSON.parse(postDetail.content || "");
    blocks = parsed?.blocks || [];
  } catch {
    blocks = [{ type: "paragraph", data: { text: postDetail.content || "" } }];
  }

  const cleanBlocks = blocks.filter((block: any) => {
    if (block.type !== "paragraph") return true;
    return stripHtml(block.data?.text || "").length > 0;
  });

  const postTags: string[] = Array.isArray(postDetail.tags)
    ? postDetail.tags
    : [];
  const relatedPosts = allPosts
    .filter(
      (p: any) => p && (p.slug || p.id) !== (postDetail.slug || postDetail.id),
    )
    .slice(0, 3);
  const dateStr = formatDate(postDetail.createdAt);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ReadingProgressBar progress={scrollProgress} />

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        bounces
        scrollEventThrottle={16}
        onScroll={handleScroll}
        onContentSizeChange={(_, h) => {
          contentHeight.current = h;
        }}
      >
        {/* ── HERO ── */}
        <View style={{ height: 300 }}>
          <HeroMedia uri={postDetail.thumbnailUrl} />
          <LinearGradient
            colors={["rgba(0,0,0,0.08)", "rgba(0,0,0,0.45)", "#0a0a0a"]}
            locations={[0, 0.6, 1]}
            style={StyleSheet.absoluteFillObject}
          />
          <SafeAreaView style={ss.heroNavRow}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={ss.heroBtn}
            >
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleShare} style={ss.heroBtn}>
              <Ionicons name="share-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </SafeAreaView>
        </View>

        {/* ── CONTENT ── */}
        <View style={{ paddingHorizontal: 20, marginTop: -16 }}>
          {/* Category badge */}
          {postDetail.categoryName ? (
            <View style={ss.catBadge}>
              <Text style={ss.catBadgeText}>
                {String(postDetail.categoryName).toUpperCase()}
              </Text>
            </View>
          ) : (
            <View style={ss.catBadge}>
              <Text style={ss.catBadgeText}>TIN TỨC</Text>
            </View>
          )}

          {/* Title */}
          <Text style={ss.articleTitle}>{postDetail.title}</Text>

          {/* Meta */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 6,
              marginBottom: 16,
            }}
          >
            <Ionicons name="time-outline" size={13} color={C.muted} />
            <Text style={{ color: C.muted, fontSize: 12 }}>
              {formatDate(postDetail.createdAt)}
            </Text>
            {postDetail.authorName ? (
              <>
                <View
                  style={{
                    width: 3,
                    height: 3,
                    borderRadius: 1.5,
                    backgroundColor: "#333",
                  }}
                />
                <Ionicons name="person-outline" size={13} color={C.muted} />
                <Text style={{ color: C.muted, fontSize: 12 }}>
                  {postDetail.authorName}
                </Text>
              </>
            ) : null}
          </View>

          {/* Summary */}
          {postDetail.summary ? (
            <View style={ss.summaryBlock}>
              <Text style={ss.summaryText}>{postDetail.summary}</Text>
            </View>
          ) : null}

          <DiamondDivider />

          {/* Article blocks */}
          {cleanBlocks.map((block: any, i: number) => renderBlock(block, i))}

          {/* Tags */}
          {postTags.length > 0 && (
            <>
              <View style={ss.sep} />
              <TagsRow tags={postTags} />
            </>
          )}

          <View style={ss.sep} />
          <ContactStrip />

          <View style={ss.sep} />
          <AuthorByline dateStr={dateStr} onShare={handleShare} />

          {/* Related */}
          {relatedPosts.length > 0 && (
            <View style={{ marginBottom: 8 }}>
              <View style={ss.sep} />
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 16,
                }}
              >
                <View
                  style={{
                    width: 3,
                    height: 24,
                    borderRadius: 2,
                    backgroundColor: C.gold,
                  }}
                />
                <View>
                  <Text
                    style={{
                      color: C.white,
                      fontSize: 15,
                      fontWeight: "900",
                      letterSpacing: -0.3,
                    }}
                  >
                    Bài viết liên quan
                  </Text>
                  <Text style={{ color: C.muted, fontSize: 11, marginTop: 1 }}>
                    Tiếp tục khám phá
                  </Text>
                </View>
              </View>
              <View style={{ gap: 10 }}>
                {relatedPosts.map((post: any) => (
                  <RelatedPostCard
                    key={post.id || post.slug}
                    post={post}
                    onPress={() =>
                      navigation.push("NewsDetail", {
                        slug: post.slug || post.id,
                      })
                    }
                  />
                ))}
              </View>
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── StyleSheet ───────────────────────────────────────────────────────────────
const ss = StyleSheet.create({
  diamond: {
    width: 7,
    height: 7,
    backgroundColor: C.gold,
    transform: [{ rotate: "45deg" }],
    shadowColor: C.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 4,
  },
  progressBarBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    zIndex: 999,
    backgroundColor: "rgba(216,201,123,0.15)",
  },
  progressBarFill: {
    height: 3,
    backgroundColor: C.gold,
    shadowColor: C.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  videoBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.gold,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  videoBadgeText: {
    color: "#000",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  heroNavRow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  heroBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  catBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 7,
    marginBottom: 12,
    backgroundColor: "rgba(216,201,123,0.15)",
    borderWidth: 1,
    borderColor: C.goldBorder,
  },
  catBadgeText: {
    color: C.gold,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2,
  },
  articleTitle: {
    color: C.white,
    fontSize: 24,
    fontWeight: "900",
    lineHeight: 32,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  summaryBlock: {
    borderLeftWidth: 3,
    borderLeftColor: C.gold,
    paddingLeft: 14,
    paddingVertical: 6,
    marginBottom: 4,
  },
  summaryText: {
    color: "#aaaaaa",
    fontSize: 16,
    fontStyle: "italic",
    lineHeight: 26,
  },
  blockImgWrap: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#111",
    position: "relative",
  },
  orderedBullet: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    marginTop: 3,
    flexShrink: 0,
    backgroundColor: "rgba(216,201,123,0.1)",
    borderWidth: 1,
    borderColor: C.goldBorder,
  },
  unorderedBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.gold,
    marginTop: 10,
    marginRight: 12,
    flexShrink: 0,
  },
  sep: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginVertical: 20,
  },
  relCard: {
    flexDirection: "row",
    height: 88,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
  },
  relThumbWrap: {
    width: 110,
    height: 88,
    position: "relative",
    backgroundColor: "#1a1a1a",
  },
  relArrow: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.goldDim,
    borderWidth: 1,
    borderColor: C.goldBorder,
  },
  authorLogoWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    overflow: "hidden",
    padding: 6,
    backgroundColor: "#1a1a0a",
    borderWidth: 1,
    borderColor: C.goldBorder,
  },
});
