import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Share,
  Linking,
  Dimensions,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useIsFocused, useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { VideoView, useVideoPlayer } from "expo-video";
import { useAppDispatch, useAppSelector } from "../../hooks/useRedux";
import { parseServerDate } from "../../utils/datetime";
import { parseInlineHtml, stripHtml } from "../../utils/html";
import { isVideoUrl } from "../../utils/media";
import { COLORS } from "../../constants/theme";
import { WEBIE_CONTACT, WEB_DOMAIN } from "../../constants/contact";
import { fetchPostDetail, fetchPosts } from "../../store/slices/newsSlice";
import { NewsRowCard, NewsRowDivider } from "../../components/cards/NewsCard";
import { Skeleton } from "../../components/common/Skeleton";
import type { Post } from "../../models/news";

const { width: W } = Dimensions.get("window");
const HERO_H = Math.round(W * 0.72);

const C = {
  gold: COLORS.primary,
  goldDim: "rgba(216,201,123,0.10)",
  goldBorder: "rgba(216,201,123,0.25)",
  bg: "#0a0a0a",
  white: "#ffffff",
  textBody: "#c4c4c4",
  muted: "#777777",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (iso?: string) => {
  if (!iso) return "";
  const d = parseServerDate(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const moc = (p: Post) => parseServerDate(p.createdAt).getTime() || 0;

/** Mở link trong bài. Link tương đối ("/news/…") thì trỏ về bản web. */
const moLink = (href: string) => {
  const url = /^(https?:|mailto:|tel:)/i.test(href)
    ? href
    : href.startsWith("/")
      ? WEB_DOMAIN + href
      : `https://${href}`;
  Linking.openURL(url).catch(() => {});
};

// ─── InlineText ───────────────────────────────────────────────────────────────
const InlineText = ({ html, style }: { html: string; style?: any }) => {
  const segs = parseInlineHtml(html);
  if (!segs.length) return null;
  return (
    <Text style={style}>
      {segs.map((seg, i) => (
        <Text
          key={i}
          onPress={seg.href ? () => moLink(seg.href!) : undefined}
          style={[
            seg.bold && { fontWeight: "800", color: "#fff" },
            seg.italic && { fontStyle: "italic" },
            seg.underline && { textDecorationLine: "underline" },
            seg.mark && { color: C.gold, fontWeight: "700" },
            seg.href && { color: C.gold, textDecorationLine: "underline" },
          ]}
        >
          {seg.text}
        </Text>
      ))}
    </Text>
  );
};

// ─── Media trong bài ──────────────────────────────────────────────────────────
const Caption = ({ text }: { text?: string }) =>
  text && stripHtml(text) ? (
    <Text style={ss.caption}>{stripHtml(text)}</Text>
  ) : null;

/**
 * Ảnh trong bài giữ đúng tỉ lệ gốc, chạm để xem toàn màn hình.
 *
 * Bản cũ cắt cứng mọi ảnh cao 220px: tấm infographic "Lịch bắn pháo hoa" mất cả
 * đầu lẫn đuôi, người đọc không xem được địa điểm nào. Ảnh quá dọc (hẹp hơn
 * 0.6) thì thu vừa khung chứ không cắt, và luôn có nút phóng to.
 */
const BlockImage = ({
  url,
  caption,
  onOpen,
}: {
  url: string;
  caption?: string;
  onOpen: (url: string) => void;
}) => {
  const [ratio, setRatio] = useState<number | null>(null);
  const quaDoc = ratio !== null && ratio < 0.6;
  return (
    <View style={ss.blockMedia}>
      <Pressable onPress={() => onOpen(url)}>
        <Image
          source={{ uri: url }}
          style={{
            width: "100%",
            aspectRatio: ratio === null ? 16 / 10 : Math.max(ratio, 0.6),
            backgroundColor: "#141414",
          }}
          resizeMode={quaDoc ? "contain" : "cover"}
          onLoad={(e: any) => {
            const s = e?.nativeEvent?.source;
            if (s?.width && s?.height) setRatio(s.width / s.height);
          }}
        />
        <View style={ss.expandBtn}>
          <Ionicons name="expand-outline" size={14} color="#fff" />
        </View>
      </Pressable>
      <Caption text={caption} />
    </View>
  );
};

/** Video trong bài: có nút điều khiển, không tự phát. */
const BlockVideo = ({ url, caption }: { url: string; caption?: string }) => {
  const player = useVideoPlayer(url);
  return (
    <View style={ss.blockMedia}>
      <VideoView
        player={player}
        style={{ width: "100%", aspectRatio: 16 / 9 }}
        contentFit="contain"
        nativeControls
      />
      <Caption text={caption} />
    </View>
  );
};

// ─── Khối nội dung EditorJS ───────────────────────────────────────────────────
const renderBlock = (
  block: any,
  index: number,
  onOpenImage: (url: string) => void,
) => {
  const { type, data } = block;

  switch (type) {
    case "header": {
      const level = data?.level || 2;
      if (level <= 2) {
        return (
          <View key={index} style={ss.h2Wrap}>
            <InlineText
              html={data?.text || ""}
              style={{
                color: C.white,
                fontSize: level === 1 ? 24 : 20,
                fontWeight: "800",
                letterSpacing: -0.4,
                lineHeight: level === 1 ? 32 : 28,
              }}
            />
          </View>
        );
      }
      return (
        <View key={index} style={{ marginTop: 16, marginBottom: 6 }}>
          <InlineText
            html={data?.text || ""}
            style={{
              color: level === 3 ? "#e5e5e5" : "#bbbbbb",
              fontSize: level === 3 ? 17 : 15,
              fontWeight: "700",
              lineHeight: level === 3 ? 24 : 21,
            }}
          />
        </View>
      );
    }

    case "paragraph": {
      const text = data?.text || "";
      if (!stripHtml(text)) return null;
      return (
        <View key={index} style={{ marginBottom: 14 }}>
          <InlineText
            html={text}
            style={{ color: C.textBody, fontSize: 16, lineHeight: 27 }}
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
              typeof item === "string" ? item : item?.content || item?.text || "";
            return (
              <View key={i} style={{ flexDirection: "row", marginBottom: 8 }}>
                {ordered ? (
                  <View style={ss.orderedBullet}>
                    <Text style={{ color: C.gold, fontSize: 11, fontWeight: "800" }}>
                      {i + 1}
                    </Text>
                  </View>
                ) : (
                  <View style={ss.unorderedBullet} />
                )}
                <InlineText
                  html={html}
                  style={{ color: C.textBody, fontSize: 16, lineHeight: 27, flex: 1 }}
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
      return isVideoUrl(url) ? (
        <BlockVideo key={index} url={url} caption={data?.caption} />
      ) : (
        <BlockImage
          key={index}
          url={url}
          caption={data?.caption}
          onOpen={onOpenImage}
        />
      );
    }

    case "quote":
      return (
        <View key={index} style={ss.quote}>
          <MaterialCommunityIcons
            name="format-quote-open"
            size={24}
            color={C.gold}
            style={{ opacity: 0.5, marginBottom: 6 }}
          />
          <InlineText
            html={data?.text || ""}
            style={{ color: "#d4d4d4", fontSize: 16, fontStyle: "italic", lineHeight: 26 }}
          />
          {data?.caption && stripHtml(data.caption) ? (
            <Text style={{ color: C.gold, fontSize: 12, fontWeight: "700", marginTop: 8 }}>
              — {stripHtml(data.caption)}
            </Text>
          ) : null}
        </View>
      );

    case "delimiter":
      return <DiamondDivider key={index} />;

    case "warning":
      return (
        <View key={index} style={ss.warning}>
          <Ionicons
            name="warning-outline"
            size={18}
            color={C.gold}
            style={{ marginRight: 10, marginTop: 2 }}
          />
          <View style={{ flex: 1 }}>
            {data?.title ? (
              <Text style={{ color: C.gold, fontSize: 13, fontWeight: "800", marginBottom: 4 }}>
                {stripHtml(data.title)}
              </Text>
            ) : null}
            <InlineText
              html={data?.message || ""}
              style={{ color: "#aaa", fontSize: 14, lineHeight: 21 }}
            />
          </View>
        </View>
      );

    case "table": {
      const rows: string[][] = data?.content || [];
      return (
        <View key={index} style={ss.table}>
          {rows.map((row, ri) => (
            <View
              key={ri}
              style={{
                flexDirection: "row",
                backgroundColor:
                  ri === 0 ? "rgba(216,201,123,0.10)" : ri % 2 === 0 ? "#0e0e0e" : "#111",
              }}
            >
              {row.map((cell, ci) => (
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
                        : { color: "#aaa", fontSize: 13, lineHeight: 18 }
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

const DiamondDivider = () => (
  <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 22 }}>
    <View style={{ flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.06)" }} />
    <View style={ss.diamond} />
    <View style={{ flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.06)" }} />
  </View>
);

const TagsRow = ({ tags }: { tags: string[] }) => (
  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
    {tags.map((tag) => (
      <View key={tag} style={ss.tag}>
        <Text style={{ color: "#999", fontSize: 12 }}>#{tag}</Text>
      </View>
    ))}
  </View>
);

// ─── Ảnh bìa ──────────────────────────────────────────────────────────────────
const HeroVideo = ({ uri, active }: { uri: string; active: boolean }) => {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = true;
  });
  // Mở bài liên quan (màn mới đè lên) thì video bài này tạm dừng
  useEffect(() => {
    try {
      if (active) player.play();
      else player.pause();
    } catch {}
  }, [active, player]);
  return (
    <VideoView
      player={player}
      style={StyleSheet.absoluteFillObject}
      contentFit="cover"
      nativeControls={false}
    />
  );
};

const HeroMedia = ({
  uri,
  onOpen,
  active,
}: {
  uri?: string | null;
  onOpen: (url: string) => void;
  active: boolean;
}) => {
  if (!uri) {
    return (
      <View style={[StyleSheet.absoluteFillObject, ss.center, { backgroundColor: "#141414" }]}>
        <Ionicons name="newspaper-outline" size={48} color="#333" />
      </View>
    );
  }
  if (isVideoUrl(uri)) return <HeroVideo uri={uri} active={active} />;
  return (
    <Pressable style={StyleSheet.absoluteFillObject} onPress={() => onOpen(uri)}>
      <Image source={{ uri }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
    </Pressable>
  );
};

// ─── Xem ảnh toàn màn hình ────────────────────────────────────────────────────
/**
 * Ảnh hiện hết bề ngang, cuộn dọc được — đủ để đọc hết một tấm infographic dài.
 * iOS phóng to bằng hai ngón qua maximumZoomScale; Android chưa có (cần thêm
 * thư viện cử chỉ), nhưng ảnh không còn bị cắt nên vẫn đọc được trọn.
 */
const ImageViewer = ({
  url,
  onClose,
  topInset,
}: {
  url: string | null;
  onClose: () => void;
  topInset: number;
}) => {
  const [ratio, setRatio] = useState(1);
  useEffect(() => setRatio(1), [url]);

  return (
    <Modal
      visible={!!url}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={{ flex: 1, backgroundColor: "#000" }}>
        {url ? (
          <ScrollView
            maximumZoomScale={4}
            minimumZoomScale={1}
            centerContent
            contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
            showsVerticalScrollIndicator={false}
          >
            <Image
              source={{ uri: url }}
              style={{ width: W, height: W / ratio }}
              resizeMode="contain"
              onLoad={(e: any) => {
                const s = e?.nativeEvent?.source;
                if (s?.width && s?.height) setRatio(s.width / s.height);
              }}
            />
          </ScrollView>
        ) : null}
        <TouchableOpacity
          onPress={onClose}
          style={[ss.navBtn, { position: "absolute", top: topInset + 10, right: 16 }]}
          accessibilityLabel="Đóng ảnh"
        >
          <Ionicons name="close" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

// ─── Bảng liên hệ ─────────────────────────────────────────────────────────────
const ContactSheet = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
  const rows = [
    { icon: "call-outline", label: WEBIE_CONTACT.phoneLabel, sub: "Gọi điện", href: `tel:${WEBIE_CONTACT.phone}` },
    { icon: "mail-outline", label: WEBIE_CONTACT.email, sub: "Gửi email", href: `mailto:${WEBIE_CONTACT.email}` },
    { icon: "globe-outline", label: WEBIE_CONTACT.websiteLabel, sub: "Mở website", href: WEBIE_CONTACT.website },
  ] as const;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.6)" }}
        onPress={onClose}
      >
        <Pressable onPress={() => {}} style={ss.sheet}>
          <View style={ss.sheetHandle} />
          <Text style={{ color: "#fff", fontSize: 17, fontWeight: "800", marginBottom: 6 }}>
            Liên hệ Webie Vietnam
          </Text>
          {rows.map((r) => (
            <TouchableOpacity
              key={r.href}
              activeOpacity={0.7}
              onPress={() => {
                onClose();
                Linking.openURL(r.href).catch(() => {});
              }}
              style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12 }}
            >
              <View style={ss.sheetIcon}>
                <Ionicons name={r.icon} size={18} color={C.gold} />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={{ color: "#fff", fontSize: 15, fontWeight: "600" }}>{r.label}</Text>
                <Text style={{ color: "#666", fontSize: 12, marginTop: 2 }}>{r.sub}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#444" />
            </TouchableOpacity>
          ))}
          <TouchableOpacity activeOpacity={0.8} onPress={onClose} style={ss.sheetCancel}>
            <Text style={{ color: "#bbb", fontSize: 14, fontWeight: "700" }}>Đóng</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

// ─── MÀN CHÍNH ────────────────────────────────────────────────────────────────
export default function NewsDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const { slug } = route.params || {};

  const allPosts: Post[] = useAppSelector((s: any) => s.news?.posts) || [];

  // Danh sách tin trả sẵn nội dung đầy đủ, nên bài mở từ danh sách hiện ngay
  // không phải chờ mạng; bản mới nhất từ /posts/{slug} tải về thì thay vào.
  const cached = useMemo(
    () =>
      allPosts.find(
        (p) => p && (p.slug === slug || String(p.id) === String(slug)),
      ) || null,
    [allPosts, slug],
  );

  // Bài được giữ trong state riêng của từng màn. Bản cũ dùng chung một
  // postDetail trong Redux: mở bài liên quan rồi quay lại thì bài trước đã
  // bị màn sau xoá mất dữ liệu, chỉ còn vòng xoay mãi mãi.
  const [post, setPost] = useState<Post | null>(cached);
  const [status, setStatus] = useState<"loading" | "ok" | "error">(
    cached ? "ok" : "loading",
  );
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [contactOpen, setContactOpen] = useState(false);

  const load = useCallback(async () => {
    if (!slug) {
      setStatus("error");
      return;
    }
    setStatus((s) => (s === "ok" ? "ok" : "loading"));
    try {
      const fresh = await dispatch(fetchPostDetail({ slug, lang: "vi" }) as any).unwrap();
      if (fresh && fresh.title) {
        setPost(fresh);
        setStatus("ok");
      } else {
        setStatus((s) => (s === "ok" ? "ok" : "error"));
      }
    } catch {
      // Đang hiện bản từ danh sách thì cứ giữ; chưa có gì mới báo lỗi
      setStatus((s) => (s === "ok" ? "ok" : "error"));
    }
  }, [slug, dispatch]);

  useEffect(() => {
    load();
    // Chỉ tải danh sách khi chưa có (để có bài liên quan). Bản cũ tải lại cả
    // danh sách 290 KB mỗi lần mở một bài.
    if (allPosts.length === 0) dispatch(fetchPosts({ lang: "vi" }) as any);
  }, [slug]);

  // Danh sách về sau khi màn đã mở: dùng luôn nếu chưa có bài
  useEffect(() => {
    if (!post && cached) {
      setPost(cached);
      setStatus("ok");
    }
  }, [cached]);

  const blocks = useMemo(() => {
    if (!post?.content) return [];
    let raw: any[] = [];
    try {
      raw = JSON.parse(post.content)?.blocks || [];
    } catch {
      raw = [{ type: "paragraph", data: { text: post.content } }];
    }
    return raw.filter(
      (b: any) => b?.type !== "paragraph" || stripHtml(b.data?.text || "").length > 0,
    );
  }, [post?.content]);

  // Bài liên quan: ưu tiên cùng danh mục và trùng tag, rồi tới bài mới hơn.
  // Bản cũ lấy đại ba bài đầu danh sách.
  const related = useMemo(() => {
    if (!post) return [];
    const tags = new Set((post.tags || []).map((t) => t.toLowerCase()));
    const diem = (p: Post) =>
      (post.categoryName && p.categoryName === post.categoryName ? 2 : 0) +
      (p.tags || []).filter((t) => tags.has(t.toLowerCase())).length;
    return allPosts
      .filter((p) => p && p.id !== post.id && p.slug !== post.slug)
      .map((p) => ({ p, d: diem(p), t: moc(p) }))
      .sort((a, b) => b.d - a.d || b.t - a.t)
      .slice(0, 3)
      .map((x) => x.p);
  }, [allPosts, post]);

  const handleShare = useCallback(async () => {
    if (!post) return;
    const url = `${WEB_DOMAIN}/news/${post.slug || slug}`;
    try {
      await Share.share({ title: post.title, message: `${post.title}\n${url}`, url });
    } catch {}
  }, [post, slug]);

  // ── Hoạt ảnh theo cuộn: chạy trên luồng UI (useNativeDriver) ────────────
  // Bản cũ setState ở mỗi sự kiện cuộn để vẽ thanh tiến độ, tức dựng lại cả
  // bài viết 60 lần mỗi giây.
  const scrollY = useRef(new Animated.Value(0)).current;
  const quangCuon = useRef(new Animated.Value(1)).current;
  const khung = useRef({ view: 0, content: 0 });
  const capNhatQuangCuon = () =>
    quangCuon.setValue(Math.max(1, khung.current.content - khung.current.view));

  const { nenDau, tienDo } = useMemo(
    () => ({
      nenDau: scrollY.interpolate({
        inputRange: [HERO_H - 150, HERO_H - 70],
        outputRange: [0, 1],
        extrapolate: "clamp",
      }),
      tienDo: Animated.divide(scrollY, quangCuon).interpolate({
        inputRange: [0, 1],
        outputRange: [-W, 0],
        extrapolate: "clamp",
      }),
    }),
    [],
  );

  const coBai = status === "ok" && !!post;
  const views = post?.viewCount && post.viewCount > 0 ? post.viewCount : 0;

  // ── Thanh đầu trang cố định ──────────────────────────────────────────────
  // Luôn có nút quay lại và chia sẻ. Khi cuộn qua ảnh bìa, nền tối và tên bài
  // hiện dần. Bản cũ để hai nút này trôi theo nội dung, và chữ bài viết cuộn
  // đè lên đồng hồ ở thanh trạng thái.
  const topBar = (
    <View pointerEvents="box-none" style={ss.topBar}>
      <Animated.View
        pointerEvents="none"
        style={[ss.topBarBg, { opacity: coBai ? nenDau : 1 }]}
      />
      <View style={[ss.topBarRow, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity
          style={ss.navBtn}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Quay lại"
        >
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Animated.Text
          numberOfLines={1}
          style={[ss.topBarTitle, { opacity: coBai ? nenDau : 0 }]}
        >
          {post?.title || ""}
        </Animated.Text>
        {coBai ? (
          <TouchableOpacity
            style={ss.navBtn}
            onPress={handleShare}
            accessibilityLabel="Chia sẻ bài viết"
          >
            <Ionicons name="share-outline" size={19} color="#fff" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>
      {coBai && (
        <Animated.View style={[ss.progressTrack, { opacity: nenDau }]}>
          <Animated.View style={[ss.progressFill, { transform: [{ translateX: tienDo }] }]} />
        </Animated.View>
      )}
    </View>
  );

  let body: React.ReactNode;
  if (status === "loading" && !post) {
    body = (
      <View style={{ flex: 1 }}>
        <Skeleton width="100%" height={HERO_H} radius={0} />
        <View style={{ padding: 20, gap: 12 }}>
          <Skeleton width={120} height={20} radius={7} />
          <Skeleton width="95%" height={24} />
          <Skeleton width="75%" height={24} />
          <Skeleton width="50%" height={12} />
          <View style={{ height: 12 }} />
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} width={i === 4 ? "60%" : "100%"} height={14} />
          ))}
        </View>
      </View>
    );
  } else if (!coBai) {
    body = (
      <View style={[ss.center, { flex: 1, paddingHorizontal: 40 }]}>
        <Ionicons name="cloud-offline-outline" size={44} color="#444" />
        <Text style={{ color: "#fff", fontSize: 16, fontWeight: "800", marginTop: 14 }}>
          Không mở được bài viết
        </Text>
        <Text style={{ color: "#777", fontSize: 13, textAlign: "center", marginTop: 6, lineHeight: 19 }}>
          Bài viết có thể đã bị gỡ, hoặc kết nối mạng đang chập chờn.
        </Text>
        <TouchableOpacity onPress={load} activeOpacity={0.85} style={ss.retryBtn}>
          <Text style={{ color: "#0a0a0a", fontSize: 13, fontWeight: "800" }}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  } else {
    const p = post!;
    const tags = Array.isArray(p.tags) ? p.tags : [];
    body = (
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        onLayout={(e) => {
          khung.current.view = e.nativeEvent.layout.height;
          capNhatQuangCuon();
        }}
        onContentSizeChange={(_, h) => {
          khung.current.content = h;
          capNhatQuangCuon();
        }}
      >
        {/* ── Ảnh bìa ── */}
        <View style={{ height: HERO_H }}>
          <HeroMedia uri={p.thumbnailUrl} onOpen={setViewerUrl} active={focused} />
          <LinearGradient
            pointerEvents="none"
            colors={["rgba(10,10,10,0.6)", "rgba(10,10,10,0)", "rgba(10,10,10,0.35)", C.bg]}
            locations={[0, 0.28, 0.65, 1]}
            style={StyleSheet.absoluteFillObject}
          />
        </View>

        <View style={{ paddingHorizontal: 20, marginTop: -26 }}>
          <View style={ss.catBadge}>
            <Text style={ss.catBadgeText}>
              {String(p.categoryName || "Tin tức").toUpperCase()}
            </Text>
          </View>

          <Text style={ss.articleTitle}>{p.title}</Text>

          {/* Ngày, tác giả, lượt xem gom một dòng — bản cũ hiện ngày hai lần
              và nút chia sẻ hai lần */}
          <View style={ss.metaRow}>
            <Text style={ss.meta}>{formatDate(p.createdAt)}</Text>
            {p.authorName ? (
              <>
                <Text style={ss.metaDot}>·</Text>
                <Text style={ss.meta}>{p.authorName}</Text>
              </>
            ) : null}
            {views ? (
              <>
                <Text style={ss.metaDot}>·</Text>
                <Text style={ss.meta}>{views.toLocaleString("vi-VN")} lượt xem</Text>
              </>
            ) : null}
          </View>

          {p.summary ? (
            <View style={ss.summaryBlock}>
              <Text style={ss.summaryText}>{stripHtml(p.summary)}</Text>
            </View>
          ) : null}

          <DiamondDivider />

          {blocks.map((b: any, i: number) => renderBlock(b, i, setViewerUrl))}

          {tags.length > 0 && <TagsRow tags={tags} />}

          {/* Cuối bài: chia sẻ + liên hệ. Thay khối "LIÊN HỆ" cũ viết cứng số
              điện thoại, email cá nhân ở cuối mọi bài. */}
          <View style={ss.endCard}>
            <Text style={{ color: "#fff", fontSize: 15, fontWeight: "800" }}>
              Bạn thấy bài viết hữu ích?
            </Text>
            <Text style={{ color: "#888", fontSize: 13, marginTop: 4, lineHeight: 19 }}>
              Chia sẻ cho bạn bè, hoặc liên hệ Webie nếu bạn cần tổ chức sự kiện.
            </Text>
            <View style={{ flexDirection: "row", marginTop: 14, gap: 10 }}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleShare}
                style={[ss.endBtn, { backgroundColor: C.gold }]}
              >
                <Ionicons name="share-social-outline" size={16} color="#0a0a0a" />
                <Text style={[ss.endBtnText, { color: "#0a0a0a" }]}>Chia sẻ</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setContactOpen(true)}
                style={[ss.endBtn, { borderWidth: 1, borderColor: C.goldBorder }]}
              >
                <Ionicons name="call-outline" size={16} color={C.gold} />
                <Text style={[ss.endBtnText, { color: C.gold }]}>Liên hệ Webie</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {related.length > 0 && (
          <View style={{ marginTop: 28 }}>
            <Text style={ss.sectionLabel}>BÀI VIẾT LIÊN QUAN</Text>
            {related.map((r, i) => (
              <View key={r.id ?? r.slug}>
                {i > 0 && <NewsRowDivider />}
                <NewsRowCard
                  post={r}
                  onPress={() => navigation.push("NewsDetail", { slug: r.slug || r.id })}
                  videoActive={focused}
                />
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 32 + insets.bottom }} />
      </Animated.ScrollView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      {body}
      {topBar}
      <ImageViewer url={viewerUrl} onClose={() => setViewerUrl(null)} topInset={insets.top} />
      <ContactSheet visible={contactOpen} onClose={() => setContactOpen(false)} />
    </View>
  );
}

// ─── StyleSheet ───────────────────────────────────────────────────────────────
const ss = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center" },
  topBar: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 20 },
  topBarBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: C.bg,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  topBarRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  topBarTitle: {
    flex: 1,
    marginHorizontal: 12,
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  progressTrack: {
    height: 2,
    overflow: "hidden",
    backgroundColor: "rgba(216,201,123,0.12)",
  },
  progressFill: { height: 2, width: W, backgroundColor: COLORS.primary },
  catBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 7,
    marginBottom: 12,
    backgroundColor: "rgba(20,20,20,0.85)",
    borderWidth: 1,
    borderColor: C.goldBorder,
  },
  catBadgeText: { color: C.gold, fontSize: 10.5, fontWeight: "800", letterSpacing: 1.6 },
  articleTitle: {
    color: C.white,
    fontSize: 25,
    fontWeight: "900",
    lineHeight: 33,
    letterSpacing: -0.5,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 18,
  },
  meta: { color: C.muted, fontSize: 12.5 },
  metaDot: { color: "#444", fontSize: 12.5, marginHorizontal: 6 },
  summaryBlock: {
    borderLeftWidth: 3,
    borderLeftColor: C.gold,
    paddingLeft: 14,
    paddingVertical: 2,
  },
  // Tóm tắt trước đây in nghiêng cả đoạn dài 9 dòng, khó đọc. Giờ chữ đứng,
  // đậm vừa và sáng hơn thân bài để vẫn nổi lên như đoạn mở đầu.
  summaryText: { color: "#e0e0e0", fontSize: 16.5, fontWeight: "500", lineHeight: 26 },
  h2Wrap: {
    borderLeftWidth: 3,
    borderLeftColor: C.gold,
    paddingLeft: 12,
    marginTop: 22,
    marginBottom: 8,
  },
  blockMedia: {
    marginTop: 4,
    marginBottom: 18,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#111",
  },
  expandBtn: {
    position: "absolute",
    right: 10,
    bottom: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  caption: {
    color: "#888",
    fontSize: 12.5,
    fontStyle: "italic",
    textAlign: "center",
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  quote: {
    backgroundColor: "#111",
    borderColor: "rgba(216,201,123,0.15)",
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  warning: {
    flexDirection: "row",
    backgroundColor: "rgba(216,201,123,0.07)",
    borderColor: C.goldBorder,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  table: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  diamond: {
    width: 7,
    height: 7,
    backgroundColor: C.gold,
    transform: [{ rotate: "45deg" }],
  },
  orderedBullet: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    marginTop: 3,
    backgroundColor: C.goldDim,
    borderWidth: 1,
    borderColor: C.goldBorder,
  },
  unorderedBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.gold,
    marginTop: 11,
    marginRight: 12,
  },
  tag: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  endCard: {
    marginTop: 24,
    padding: 18,
    borderRadius: 20,
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  endBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 12,
    borderRadius: 14,
  },
  endBtnText: { fontSize: 13.5, fontWeight: "800" },
  sectionLabel: {
    color: "#777",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.6,
    paddingHorizontal: 20,
    marginBottom: 2,
  },
  retryBtn: {
    marginTop: 18,
    paddingHorizontal: 26,
    paddingVertical: 11,
    borderRadius: 100,
    backgroundColor: COLORS.primary,
  },
  sheet: {
    backgroundColor: "#181818",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#333",
    alignSelf: "center",
    marginBottom: 16,
  },
  sheetIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.goldDim,
  },
  sheetCancel: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
});
