import React, { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
    AccessibilityInfo,
    Animated,
    Easing,
    LayoutChangeEvent,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppBottomSheet } from "../../components/ui/AppBottomSheet";
import { AppButton } from "../../components/ui/AppButton";
import { AppCard } from "../../components/ui/AppCard";
import { StatusPill } from "../../components/ui/StatusPill";
import {
    landingContent,
    type LandingDirectionItem,
    type LandingSectionId,
} from "../../data/landingContent";
import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";
import { useTheme } from "../../theme/useTheme";
import type { RoleWorkspaceOption, UserRole } from "../../types/academy";

interface LandingScreenProps {
    roleOptions: RoleWorkspaceOption[];
    onEnterRole: (role: UserRole) => void;
}

type CtaSheetKind = "demo" | "implementation";

type LandingSheetState =
    | { kind: CtaSheetKind }
    | { kind: "direction"; direction: LandingDirectionItem }
    | null;

function Reveal({
    children,
    delay = 0,
    distance = 18,
    duration = 640,
    reduceMotion = false,
    style,
}: {
    children: ReactNode;
    delay?: number;
    distance?: number;
    duration?: number;
    reduceMotion?: boolean;
    style?: object;
}) {
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(distance)).current;

    useEffect(() => {
        if (reduceMotion) {
            opacity.setValue(1);
            translateY.setValue(0);
            return;
        }

        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 1,
                duration,
                delay,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: 0,
                duration,
                delay,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
        ]).start();
    }, [delay, duration, opacity, reduceMotion, translateY]);

    return (
        <Animated.View
            style={[
                style,
                {
                    opacity,
                    transform: [{ translateY }],
                },
            ]}
        >
            {children}
        </Animated.View>
    );
}

function TriggeredReveal({
    children,
    active,
    delay = 0,
    duration = 920,
    variant = "up",
    distance = 34,
    reduceMotion = false,
    style,
}: {
    children: ReactNode;
    active: boolean;
    delay?: number;
    duration?: number;
    variant?: "up" | "left" | "right" | "fade";
    distance?: number;
    reduceMotion?: boolean;
    style?: object;
}) {
    const hasAnimated = useRef(false);
    const opacity = useRef(new Animated.Value(0)).current;
    const translateX = useRef(
        new Animated.Value(
            variant === "left" ? -distance : variant === "right" ? distance : 0,
        ),
    ).current;
    const translateY = useRef(
        new Animated.Value(variant === "up" ? distance * 0.5 : 0),
    ).current;

    useEffect(() => {
        if (reduceMotion) {
            opacity.setValue(1);
            translateX.setValue(0);
            translateY.setValue(0);
            hasAnimated.current = true;
            return;
        }

        if (!active || hasAnimated.current) {
            return;
        }

        hasAnimated.current = true;

        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 1,
                duration,
                delay,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.timing(translateX, {
                toValue: 0,
                duration: duration + 140,
                delay,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: 0,
                duration: duration + 140,
                delay,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
        ]).start();
    }, [
        active,
        delay,
        duration,
        opacity,
        reduceMotion,
        translateX,
        translateY,
    ]);

    return (
        <Animated.View
            style={[
                style,
                {
                    opacity,
                    transform: [{ translateX }, { translateY }],
                },
            ]}
        >
            {children}
        </Animated.View>
    );
}

export function LandingScreen({
    roleOptions,
    onEnterRole,
}: LandingScreenProps) {
    const theme = useTheme();
    const layout = useResponsiveLayout();
    const scrollRef = useRef<ScrollView>(null);
    const floatingMotion = useRef(new Animated.Value(0)).current;
    const mobileMenuProgress = useRef(new Animated.Value(0)).current;
    const [sheetState, setSheetState] = useState<LandingSheetState>(null);
    const [activeNavId, setActiveNavId] = useState<LandingSectionId>("problem");
    const [sectionOffsets, setSectionOffsets] = useState<
        Partial<Record<LandingSectionId, number>>
    >({});
    const [headerHeight, setHeaderHeight] = useState(92);
    const [scrollOffset, setScrollOffset] = useState(0);
    const [contactName, setContactName] = useState("");
    const [contactCompany, setContactCompany] = useState("");
    const [contactGoal, setContactGoal] = useState("");
    const [submittedKind, setSubmittedKind] = useState<CtaSheetKind | null>(
        null,
    );
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [reduceMotion, setReduceMotion] = useState(false);

    const isDesktop = layout.isDesktop;
    const isMobile = layout.isMobile;
    const isCompactMobile = layout.isCompactMobile;
    const isSmallMobile = layout.isSmallMobile;
    const cardWidth = isDesktop ? "48.6%" : "100%";
    const metricWidth = isDesktop
        ? layout.isWide
            ? "23.4%"
            : "48.6%"
        : !isCompactMobile
          ? "48.4%"
          : "100%";
    const stageWidth = isDesktop ? (layout.isWide ? "31.8%" : "48.6%") : "100%";
    const motionDistance = isMobile ? 18 : 34;
    const motionDuration = isMobile ? 520 : 640;
    const containerStyle = useMemo(
        () => [
            styles.container,
            {
                maxWidth: 1200,
                paddingHorizontal: layout.screenPadding,
            },
        ],
        [layout.screenPadding],
    );
    const mobileMenuAnimatedStyle = useMemo(
        () => ({
            opacity: mobileMenuProgress,
            transform: [
                {
                    translateY: mobileMenuProgress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-10, 0],
                    }),
                },
            ],
        }),
        [mobileMenuProgress],
    );

    useEffect(() => {
        let mounted = true;
        AccessibilityInfo.isReduceMotionEnabled()
            .then((enabled) => {
                if (mounted) {
                    setReduceMotion(enabled);
                }
            })
            .catch(() => undefined);

        const subscription = AccessibilityInfo.addEventListener(
            "reduceMotionChanged",
            setReduceMotion,
        );

        return () => {
            mounted = false;
            subscription.remove();
        };
    }, []);

    useEffect(() => {
        if (reduceMotion) {
            floatingMotion.stopAnimation();
            floatingMotion.setValue(0);
            return;
        }

        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(floatingMotion, {
                    toValue: -10,
                    duration: 2600,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(floatingMotion, {
                    toValue: 0,
                    duration: 2600,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
            ]),
        );

        loop.start();

        return () => {
            loop.stop();
            floatingMotion.stopAnimation();
        };
    }, [floatingMotion, isMobile, reduceMotion]);

    useEffect(() => {
        Animated.timing(mobileMenuProgress, {
            toValue: isMobileMenuOpen ? 1 : 0,
            duration: reduceMotion ? 0 : 220,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
        }).start();
    }, [isMobileMenuOpen, mobileMenuProgress, reduceMotion]);

    useEffect(() => {
        if (!isMobile) {
            setIsMobileMenuOpen(false);
        }
    }, [isMobile]);

    function openCtaSheet(kind: CtaSheetKind) {
        setSubmittedKind(null);
        setIsMobileMenuOpen(false);
        setSheetState({ kind });
    }

    function openStudentWorkspace() {
        setSubmittedKind(null);
        setIsMobileMenuOpen(false);
        onEnterRole("student");
    }

    function scrollToSection(sectionId: LandingSectionId) {
        const y = sectionOffsets[sectionId];

        if (typeof y === "number") {
            scrollRef.current?.scrollTo({
                y: Math.max(0, y - headerHeight - 18),
                animated: true,
            });
        }

        setActiveNavId(sectionId);
        setIsMobileMenuOpen(false);
    }

    function registerSection(sectionId: LandingSectionId) {
        return (event: LayoutChangeEvent) => {
            const { y } = event.nativeEvent.layout;
            setSectionOffsets((current) => ({ ...current, [sectionId]: y }));
        };
    }

    function handleScroll(offsetY: number) {
        setScrollOffset(offsetY);
        const probeY = offsetY + headerHeight + 40;
        let currentSection = activeNavId;

        for (const item of landingContent.navLinks) {
            const sectionY = sectionOffsets[item.id];

            if (typeof sectionY === "number" && probeY >= sectionY) {
                currentSection = item.id;
            }
        }

        if (currentSection !== activeNavId) {
            setActiveNavId(currentSection);
        }
    }

    const ctaTitle =
        sheetState?.kind === "implementation"
            ? "Обсудить внедрение"
            : sheetState?.kind === "direction"
              ? sheetState.direction.title
              : "Записаться на демо";
    const ctaDescription =
        sheetState?.kind === "implementation"
            ? "Соберите задачу внедрения под ваш контур: сценарии, знания, отчёты и интеграции."
            : sheetState?.kind === "direction"
              ? `${sheetState.direction.audience}. ${sheetState.direction.outcome}.`
              : "Оставьте задачу команды, и мы покажем, как может выглядеть база знаний, тренажёр и отчёты.";
    const actionSheetKind: CtaSheetKind =
        sheetState?.kind === "implementation" ? "implementation" : "demo";
    const viewportBottom = scrollOffset + layout.height;
    const compactButtonProps = isMobile ? { fullWidth: true } : {};
    const sectionTitleStyle = isSmallMobile
        ? styles.sectionTitleSmallMobile
        : isCompactMobile
          ? styles.sectionTitleMobile
          : null;
    const heroTitleStyle = isSmallMobile
        ? styles.heroTitleSmallMobile
        : isCompactMobile
          ? styles.heroTitleMobile
          : null;
    const finalTitleStyle = isSmallMobile
        ? styles.finalTitleSmallMobile
        : isCompactMobile
          ? styles.finalTitleMobile
          : null;
    const securityTitleStyle = isSmallMobile
        ? styles.securityTitleSmallMobile
        : isCompactMobile
          ? styles.securityTitleMobile
          : null;

    function isSectionRevealActive(sectionId: LandingSectionId, offset = 0) {
        const sectionY = sectionOffsets[sectionId];

        if (typeof sectionY !== "number") {
            return false;
        }

        return viewportBottom >= sectionY + offset;
    }

    return (
        <SafeAreaView
            style={[
                styles.safeArea,
                { backgroundColor: theme.semantic.background },
            ]}
        >
            <ScrollView
                ref={scrollRef}
                stickyHeaderIndices={[0]}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                onScroll={({ nativeEvent }) =>
                    handleScroll(nativeEvent.contentOffset.y)
                }
                scrollEventThrottle={16}
            >
                <View
                    onLayout={(event) =>
                        setHeaderHeight(event.nativeEvent.layout.height)
                    }
                    style={[
                        styles.stickyHeader,
                        {
                            backgroundColor: "rgba(252, 254, 252, 0.84)",
                            borderBottomColor: theme.semantic.borderSubtle,
                        },
                    ]}
                >
                    <View style={containerStyle}>
                        <View
                            style={[
                                styles.headerSurface,
                                isMobile && styles.headerSurfaceMobile,
                                isMobile && styles.headerSurfaceMobileLayered,
                                {
                                    borderColor: theme.semantic.border,
                                    backgroundColor: "rgba(255,255,255,0.78)",
                                },
                                Platform.OS === "web"
                                    ? ({
                                          backdropFilter: "blur(18px)",
                                      } as object)
                                    : null,
                            ]}
                        >
                            <View
                                style={[
                                    styles.headerTopRow,
                                    isMobile && styles.headerTopRowMobile,
                                ]}
                            >
                                <View style={styles.brandBlock}>
                                    <View
                                        style={[
                                            styles.brandMark,
                                            {
                                                backgroundColor:
                                                    theme.semantic
                                                        .actionPrimary,
                                            },
                                        ]}
                                    >
                                        <Text style={styles.brandMarkText}>
                                            AI
                                        </Text>
                                    </View>
                                    <View style={styles.brandTextBlock}>
                                        <Text
                                            style={[
                                                styles.brandTitle,
                                                isSmallMobile &&
                                                    styles.brandTitleSmallMobile,
                                                {
                                                    color: theme.semantic
                                                        .textPrimary,
                                                },
                                            ]}
                                        >
                                            AI Sales Academy
                                        </Text>
                                        <Text
                                            style={[
                                                styles.brandSubtitle,
                                                isMobile &&
                                                    styles.brandSubtitleMobile,
                                                {
                                                    color: theme.semantic
                                                        .textMuted,
                                                },
                                            ]}
                                        >
                                            Академия продаж
                                        </Text>
                                    </View>
                                </View>

                                {isMobile ? (
                                    <Pressable
                                        accessibilityRole="button"
                                        accessibilityLabel={
                                            isMobileMenuOpen
                                                ? "Закрыть меню навигации"
                                                : "Открыть меню навигации"
                                        }
                                        accessibilityState={{
                                            expanded: isMobileMenuOpen,
                                        }}
                                        onPress={() =>
                                            setIsMobileMenuOpen(
                                                (current) => !current,
                                            )
                                        }
                                        style={({ pressed }) => [
                                            styles.menuButton,
                                            {
                                                borderColor:
                                                    theme.semantic.border,
                                                backgroundColor: pressed
                                                    ? theme.semantic.cardSubtle
                                                    : "rgba(255,255,255,0.84)",
                                            },
                                        ]}
                                    >
                                        <View
                                            style={[
                                                styles.menuButtonBar,
                                                {
                                                    backgroundColor:
                                                        theme.semantic
                                                            .textPrimary,
                                                },
                                            ]}
                                        />
                                        <View
                                            style={[
                                                styles.menuButtonBar,
                                                {
                                                    backgroundColor:
                                                        theme.semantic
                                                            .textPrimary,
                                                },
                                            ]}
                                        />
                                        <View
                                            style={[
                                                styles.menuButtonBar,
                                                {
                                                    backgroundColor:
                                                        theme.semantic
                                                            .textPrimary,
                                                },
                                            ]}
                                        />
                                    </Pressable>
                                ) : null}

                                <View
                                    style={[
                                        styles.headerActions,
                                        isMobile &&
                                            styles.headerActionsHiddenMobile,
                                    ]}
                                >
                                    <View
                                        style={[
                                            styles.navRow,
                                            isMobile && styles.navRowMobile,
                                        ]}
                                    >
                                        {landingContent.navLinks.map((link) => (
                                            <Pressable
                                                key={link.id}
                                                accessibilityRole="button"
                                                accessibilityLabel={link.label}
                                                onPress={() =>
                                                    scrollToSection(link.id)
                                                }
                                                style={(state) => {
                                                    const hovered =
                                                        "hovered" in state &&
                                                        Boolean(
                                                            (
                                                                state as {
                                                                    hovered?: boolean;
                                                                }
                                                            ).hovered,
                                                        );

                                                    return [
                                                        styles.navChip,
                                                        {
                                                            borderColor:
                                                                activeNavId ===
                                                                link.id
                                                                    ? theme
                                                                          .semantic
                                                                          .actionPrimary
                                                                    : theme
                                                                          .semantic
                                                                          .border,
                                                            backgroundColor:
                                                                activeNavId ===
                                                                link.id
                                                                    ? theme
                                                                          .colors
                                                                          .primaryPale
                                                                    : hovered
                                                                      ? theme
                                                                            .semantic
                                                                            .cardSubtle
                                                                      : "rgba(255,255,255,0.72)",
                                                            opacity:
                                                                state.pressed
                                                                    ? 0.92
                                                                    : 1,
                                                        },
                                                    ];
                                                }}
                                            >
                                                <Text
                                                    style={[
                                                        styles.navChipText,
                                                        {
                                                            color:
                                                                activeNavId ===
                                                                link.id
                                                                    ? theme
                                                                          .semantic
                                                                          .actionSecondaryText
                                                                    : theme
                                                                          .semantic
                                                                          .textSecondary,
                                                        },
                                                    ]}
                                                >
                                                    {link.label}
                                                </Text>
                                            </Pressable>
                                        ))}
                                    </View>

                                    <AppButton
                                        label="Попробовать"
                                        onPress={openStudentWorkspace}
                                        tone="secondary"
                                        accessibilityLabel="Сразу открыть кабинет ученика"
                                    />
                                </View>
                            </View>

                            {isMobile ? (
                                <Animated.View
                                    pointerEvents={
                                        isMobileMenuOpen ? "auto" : "none"
                                    }
                                    style={[
                                        styles.mobileMenuDropdown,
                                        mobileMenuAnimatedStyle,
                                        {
                                            borderColor: theme.semantic.border,
                                            backgroundColor:
                                                "rgba(255,255,255,0.97)",
                                        },
                                    ]}
                                >
                                    <View style={styles.mobileMenuActions}>
                                        <View style={styles.mobileMenuNavList}>
                                            {landingContent.navLinks.map(
                                                (link) => (
                                                    <Pressable
                                                        key={link.id}
                                                        accessibilityRole="button"
                                                        accessibilityLabel={
                                                            link.label
                                                        }
                                                        onPress={() =>
                                                            scrollToSection(
                                                                link.id,
                                                            )
                                                        }
                                                        style={({
                                                            pressed,
                                                        }) => [
                                                            styles.mobileMenuNavItem,
                                                            {
                                                                borderColor:
                                                                    activeNavId ===
                                                                    link.id
                                                                        ? theme
                                                                              .semantic
                                                                              .actionPrimary
                                                                        : theme
                                                                              .semantic
                                                                              .border,
                                                                backgroundColor:
                                                                    activeNavId ===
                                                                    link.id
                                                                        ? theme
                                                                              .colors
                                                                              .primaryPale
                                                                        : pressed
                                                                          ? theme
                                                                                .semantic
                                                                                .cardSubtle
                                                                          : theme
                                                                                .semantic
                                                                                .card,
                                                            },
                                                        ]}
                                                    >
                                                        <Text
                                                            style={[
                                                                styles.mobileMenuNavText,
                                                                {
                                                                    color:
                                                                        activeNavId ===
                                                                        link.id
                                                                            ? theme
                                                                                  .semantic
                                                                                  .actionSecondaryText
                                                                            : theme
                                                                                  .semantic
                                                                                  .textPrimary,
                                                                },
                                                            ]}
                                                        >
                                                            {link.label}
                                                        </Text>
                                                    </Pressable>
                                                ),
                                            )}
                                        </View>
                                        <View
                                            style={
                                                styles.mobileMenuButtonColumn
                                            }
                                        >
                                            <AppButton
                                                label="Попробовать"
                                                onPress={openStudentWorkspace}
                                                tone="secondary"
                                                fullWidth
                                                accessibilityLabel="Сразу открыть кабинет ученика"
                                            />
                                        </View>
                                    </View>
                                </Animated.View>
                            ) : null}
                        </View>
                    </View>
                </View>

                <View style={containerStyle}>
                    <Reveal
                        delay={50}
                        distance={motionDistance}
                        duration={motionDuration}
                        reduceMotion={reduceMotion}
                    >
                        <View
                            style={[
                                styles.heroSection,
                                isDesktop && styles.heroDesktop,
                                isMobile && styles.heroSectionMobile,
                            ]}
                        >
                            <View
                                style={[
                                    styles.heroCopy,
                                    isMobile && styles.heroCopyMobile,
                                ]}
                            >
                                <StatusPill
                                    label={landingContent.hero.eyebrow}
                                    tone="success"
                                />
                                <Text
                                    style={[
                                        styles.heroTitle,
                                        heroTitleStyle,
                                        { color: theme.semantic.textPrimary },
                                    ]}
                                >
                                    {landingContent.hero.title}
                                </Text>
                                <Text
                                    style={[
                                        styles.heroDescription,
                                        isMobile &&
                                            styles.heroDescriptionMobile,
                                        { color: theme.semantic.textSecondary },
                                    ]}
                                >
                                    {landingContent.hero.description}
                                </Text>
                                <View
                                    style={[
                                        styles.heroActions,
                                        isMobile
                                            ? styles.heroActionsMobile
                                            : styles.heroActionsDesktop,
                                    ]}
                                >
                                    <AppButton
                                        label="Попробовать"
                                        onPress={openStudentWorkspace}
                                        tone="primary"
                                        {...compactButtonProps}
                                    />
                                </View>
                            </View>

                            <Animated.View
                                style={[
                                    styles.heroVisualWrap,
                                    isMobile && styles.heroVisualWrapMobile,
                                    {
                                        transform: [
                                            { translateY: floatingMotion },
                                        ],
                                    },
                                ]}
                            >
                                <View
                                    style={[
                                        styles.heroGlow,
                                        isMobile && styles.heroGlowMobile,
                                        {
                                            backgroundColor:
                                                theme.colors.mintGlow,
                                        },
                                    ]}
                                />
                                <AppCard
                                    style={[
                                        styles.heroVisualCard,
                                        isMobile && styles.heroVisualCardMobile,
                                    ]}
                                >
                                    <View style={styles.heroMockHeader}>
                                        <StatusPill
                                            label="ИИ-тренажёр"
                                            tone="success"
                                        />
                                        <View
                                            style={[
                                                styles.scoreBadge,
                                                {
                                                    backgroundColor:
                                                        theme.colors
                                                            .primaryPale,
                                                },
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.scoreBadgeLabel,
                                                    {
                                                        color: theme.semantic
                                                            .actionSecondaryText,
                                                    },
                                                ]}
                                            >
                                                84/100
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.mockChatColumn}>
                                        <View
                                            style={[
                                                styles.mockBubble,
                                                isMobile &&
                                                    styles.mockBubbleMobile,
                                                styles.mockBubbleClient,
                                                {
                                                    backgroundColor:
                                                        theme.semantic
                                                            .cardSubtle,
                                                },
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.mockBubbleRole,
                                                    {
                                                        color: theme.semantic
                                                            .textMuted,
                                                    },
                                                ]}
                                            >
                                                Клиент
                                            </Text>
                                            <Text
                                                style={[
                                                    styles.mockBubbleText,
                                                    {
                                                        color: theme.semantic
                                                            .textPrimary,
                                                    },
                                                ]}
                                            >
                                                После встречи менеджеры часто
                                                теряют следующий шаг, и клиент
                                                уходит без понятной
                                                договорённости.
                                            </Text>
                                        </View>
                                        <View
                                            style={[
                                                styles.mockBubble,
                                                isMobile &&
                                                    styles.mockBubbleMobile,
                                                styles.mockBubbleManager,
                                                {
                                                    backgroundColor:
                                                        theme.colors
                                                            .primaryPale,
                                                    borderColor:
                                                        theme.semantic.border,
                                                },
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.mockBubbleRole,
                                                    {
                                                        color: theme.semantic
                                                            .actionSecondaryText,
                                                    },
                                                ]}
                                            >
                                                Менеджер
                                            </Text>
                                            <Text
                                                style={[
                                                    styles.mockBubbleText,
                                                    {
                                                        color: theme.semantic
                                                            .textPrimary,
                                                    },
                                                ]}
                                            >
                                                Покажите, на каком этапе чаще
                                                всего теряется контроль:
                                                диагностика, аргументация или
                                                фиксация следующего шага?
                                            </Text>
                                        </View>
                                    </View>

                                    <View
                                        style={[
                                            styles.mockStatsRow,
                                            isMobile &&
                                                styles.mockStatsRowMobile,
                                        ]}
                                    >
                                        <View
                                            style={[
                                                styles.mockStatCard,
                                                isMobile &&
                                                    styles.mockStatCardMobile,
                                                {
                                                    backgroundColor:
                                                        theme.semantic
                                                            .cardSubtle,
                                                },
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.mockStatLabel,
                                                    {
                                                        color: theme.semantic
                                                            .textMuted,
                                                    },
                                                ]}
                                            >
                                                Soft skills
                                            </Text>
                                            <MetricBar value={81} />
                                        </View>
                                        <View
                                            style={[
                                                styles.mockStatCard,
                                                isMobile &&
                                                    styles.mockStatCardMobile,
                                                {
                                                    backgroundColor:
                                                        theme.semantic
                                                            .cardSubtle,
                                                },
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.mockStatLabel,
                                                    {
                                                        color: theme.semantic
                                                            .textMuted,
                                                    },
                                                ]}
                                            >
                                                Hard skills
                                            </Text>
                                            <MetricBar value={74} />
                                        </View>
                                    </View>

                                    <View
                                        style={[
                                            styles.progressPanel,
                                            isMobile &&
                                                styles.progressPanelMobile,
                                            {
                                                borderColor:
                                                    theme.semantic.border,
                                            },
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.progressTitle,
                                                {
                                                    color: theme.semantic
                                                        .textPrimary,
                                                },
                                            ]}
                                        >
                                            Следующий шаг тренировки
                                        </Text>
                                        <MetricBar value={58} />
                                        <Text
                                            style={[
                                                styles.progressCaption,
                                                {
                                                    color: theme.semantic
                                                        .textSecondary,
                                                },
                                            ]}
                                        >
                                            Система подсказывает, какой навык
                                            стоит доработать в следующей
                                            практике, чтобы разговор не
                                            разваливался после основной части
                                            диалога.
                                        </Text>
                                    </View>
                                </AppCard>
                            </Animated.View>
                        </View>
                    </Reveal>

                    <Reveal
                        delay={120}
                        distance={motionDistance}
                        duration={motionDuration}
                        reduceMotion={reduceMotion}
                    >
                        <View
                            style={[
                                styles.sectionStack,
                                isMobile && styles.metricSectionMobile,
                            ]}
                        >
                            <View style={styles.sectionHeading}>
                                <Text
                                    style={[
                                        styles.sectionEyebrow,
                                        { color: theme.semantic.textMuted },
                                    ]}
                                >
                                    Потенциальный эффект
                                </Text>
                                <Text
                                    style={[
                                        styles.sectionLead,
                                        { color: theme.semantic.textSecondary },
                                    ]}
                                >
                                    {landingContent.metricIntro}
                                </Text>
                            </View>
                            <View style={styles.metricGrid}>
                                {landingContent.metrics.map((item, index) => (
                                    <Reveal
                                        key={item.value}
                                        delay={140 + index * 70}
                                        distance={motionDistance}
                                        duration={motionDuration}
                                        reduceMotion={reduceMotion}
                                        style={{ width: metricWidth }}
                                    >
                                        <AppCard
                                            tone={
                                                index % 2 === 0
                                                    ? "mint"
                                                    : "default"
                                            }
                                            style={styles.metricCard}
                                        >
                                            <Text
                                                style={[
                                                    styles.metricValue,
                                                    {
                                                        color: theme.semantic
                                                            .textPrimary,
                                                    },
                                                ]}
                                            >
                                                {item.value}
                                            </Text>
                                            <Text
                                                style={[
                                                    styles.metricLabel,
                                                    {
                                                        color: theme.semantic
                                                            .textPrimary,
                                                    },
                                                ]}
                                            >
                                                {item.label}
                                            </Text>
                                            <Text
                                                style={[
                                                    styles.metricCaption,
                                                    {
                                                        color: theme.semantic
                                                            .textSecondary,
                                                    },
                                                ]}
                                            >
                                                {item.caption}
                                            </Text>
                                        </AppCard>
                                    </Reveal>
                                ))}
                            </View>
                        </View>
                    </Reveal>

                    <View
                        onLayout={registerSection("problem")}
                        style={[
                            styles.sectionAnchor,
                            isMobile && styles.sectionAnchorMobile,
                        ]}
                    >
                        <Reveal
                            delay={180}
                            distance={motionDistance}
                            duration={motionDuration}
                            reduceMotion={reduceMotion}
                        >
                            <View
                                style={[
                                    styles.problemSection,
                                    isDesktop && styles.problemDesktop,
                                    isMobile && styles.problemSectionMobile,
                                ]}
                            >
                                <View style={styles.problemListColumn}>
                                    <Text
                                        style={[
                                            styles.sectionTitle,
                                            sectionTitleStyle,
                                            {
                                                color: theme.semantic
                                                    .textPrimary,
                                            },
                                        ]}
                                    >
                                        {landingContent.problemTitle}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.sectionLead,
                                            {
                                                color: theme.semantic
                                                    .textSecondary,
                                            },
                                        ]}
                                    >
                                        {landingContent.problemLead}
                                    </Text>
                                    <View style={styles.problemList}>
                                        {landingContent.problemItems.map(
                                            (item, index) => (
                                                <TriggeredReveal
                                                    key={item.title}
                                                    active={isSectionRevealActive(
                                                        "problem",
                                                        isMobile ? 70 : 120,
                                                    )}
                                                    delay={index * 140}
                                                    duration={
                                                        isMobile ? 760 : 980
                                                    }
                                                    distance={
                                                        isMobile ? 18 : 52
                                                    }
                                                    variant="left"
                                                    reduceMotion={reduceMotion}
                                                >
                                                    <AppCard
                                                        style={
                                                            styles.problemCard
                                                        }
                                                    >
                                                        <View
                                                            style={
                                                                styles.problemCardHeader
                                                            }
                                                        >
                                                            <View
                                                                style={[
                                                                    styles.problemIndex,
                                                                    {
                                                                        backgroundColor:
                                                                            theme
                                                                                .colors
                                                                                .primaryPale,
                                                                    },
                                                                ]}
                                                            >
                                                                <Text
                                                                    style={[
                                                                        styles.problemIndexText,
                                                                        {
                                                                            color: theme
                                                                                .semantic
                                                                                .actionSecondaryText,
                                                                        },
                                                                    ]}
                                                                >
                                                                    {`0${index + 1}`}
                                                                </Text>
                                                            </View>
                                                            <Text
                                                                style={[
                                                                    styles.cardTitle,
                                                                    isCompactMobile &&
                                                                        styles.cardTitleMobile,
                                                                    {
                                                                        color: theme
                                                                            .semantic
                                                                            .textPrimary,
                                                                    },
                                                                ]}
                                                            >
                                                                {item.title}
                                                            </Text>
                                                        </View>
                                                        <Text
                                                            style={[
                                                                styles.bodyText,
                                                                {
                                                                    color: theme
                                                                        .semantic
                                                                        .textSecondary,
                                                                },
                                                            ]}
                                                        >
                                                            {item.description}
                                                        </Text>
                                                    </AppCard>
                                                </TriggeredReveal>
                                            ),
                                        )}
                                    </View>
                                </View>

                                <TriggeredReveal
                                    active={isSectionRevealActive(
                                        "problem",
                                        isMobile ? 140 : 250,
                                    )}
                                    delay={80}
                                    duration={isMobile ? 680 : 860}
                                    variant="fade"
                                    reduceMotion={reduceMotion}
                                    style={[
                                        styles.problemAccentWrap,
                                        isMobile &&
                                            styles.problemAccentWrapMobile,
                                    ]}
                                >
                                    <View
                                        style={[
                                            styles.problemAccentCard,
                                            isMobile &&
                                                styles.problemAccentCardMobile,
                                            {
                                                backgroundColor:
                                                    theme.colors.primaryDeep,
                                                borderColor:
                                                    theme.colors.primary,
                                            },
                                        ]}
                                    >
                                        <View
                                            style={[
                                                styles.problemAccentGlow,
                                                {
                                                    backgroundColor:
                                                        theme.colors
                                                            .primarySoft,
                                                },
                                            ]}
                                        />
                                        <View
                                            style={[
                                                styles.problemAccentCopy,
                                                isMobile &&
                                                    styles.problemAccentCopyMobile,
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.problemAccentTitle,
                                                    isCompactMobile &&
                                                        styles.problemAccentTitleMobile,
                                                ]}
                                            >
                                                {landingContent.problemAccent}
                                            </Text>
                                            <Text
                                                style={styles.problemAccentBody}
                                            >
                                                В материалах Академии продаж эта
                                                мысль вынесена как базовый
                                                принцип: безопасная практика
                                                должна происходить до реального
                                                диалога.
                                            </Text>
                                        </View>
                                    </View>
                                </TriggeredReveal>
                            </View>
                        </Reveal>
                    </View>

                    <View
                        onLayout={registerSection("solution")}
                        style={[
                            styles.sectionAnchor,
                            isMobile && styles.sectionAnchorMobile,
                        ]}
                    >
                        <Reveal
                            delay={220}
                            distance={motionDistance}
                            duration={motionDuration}
                            reduceMotion={reduceMotion}
                        >
                            <View style={styles.sectionStack}>
                                <View style={styles.sectionHeading}>
                                    <Text
                                        style={[
                                            styles.sectionTitle,
                                            sectionTitleStyle,
                                            {
                                                color: theme.semantic
                                                    .textPrimary,
                                            },
                                        ]}
                                    >
                                        {landingContent.solutionTitle}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.sectionLead,
                                            {
                                                color: theme.semantic
                                                    .textSecondary,
                                            },
                                        ]}
                                    >
                                        {landingContent.solutionDescription}
                                    </Text>
                                </View>

                                <View style={styles.flowRow}>
                                    {landingContent.flowSteps.map(
                                        (step, index) => (
                                            <Reveal
                                                key={step.title}
                                                delay={240 + index * 70}
                                                distance={motionDistance}
                                                duration={motionDuration}
                                                reduceMotion={reduceMotion}
                                                style={[
                                                    styles.flowStepWrap,
                                                    isDesktop &&
                                                        styles.flowStepWrapDesktop,
                                                ]}
                                            >
                                                <View style={styles.flowStep}>
                                                    <View
                                                        style={[
                                                            styles.flowStepIndex,
                                                            {
                                                                backgroundColor:
                                                                    theme.colors
                                                                        .primaryPale,
                                                                borderColor:
                                                                    theme
                                                                        .semantic
                                                                        .border,
                                                            },
                                                        ]}
                                                    >
                                                        <Text
                                                            style={[
                                                                styles.flowStepIndexText,
                                                                {
                                                                    color: theme
                                                                        .semantic
                                                                        .actionSecondaryText,
                                                                },
                                                            ]}
                                                        >
                                                            {`${index + 1}`}
                                                        </Text>
                                                    </View>
                                                    <Text
                                                        style={[
                                                            styles.flowStepTitle,
                                                            {
                                                                color: theme
                                                                    .semantic
                                                                    .textPrimary,
                                                            },
                                                        ]}
                                                    >
                                                        {step.title}
                                                    </Text>
                                                    <Text
                                                        style={[
                                                            styles.flowStepDescription,
                                                            {
                                                                color: theme
                                                                    .semantic
                                                                    .textSecondary,
                                                            },
                                                        ]}
                                                    >
                                                        {step.description}
                                                    </Text>
                                                    {index <
                                                    landingContent.flowSteps
                                                        .length -
                                                        1 ? (
                                                        <View
                                                            style={[
                                                                styles.flowConnector,
                                                                isDesktop
                                                                    ? styles.flowConnectorDesktop
                                                                    : styles.flowConnectorMobile,
                                                                {
                                                                    backgroundColor:
                                                                        theme
                                                                            .colors
                                                                            .primarySoft,
                                                                },
                                                            ]}
                                                        />
                                                    ) : null}
                                                </View>
                                            </Reveal>
                                        ),
                                    )}
                                </View>

                                <View style={styles.solutionGrid}>
                                    {landingContent.solutionItems.map(
                                        (item, index) => (
                                            <Reveal
                                                key={item.title}
                                                delay={280 + index * 70}
                                                distance={motionDistance}
                                                duration={motionDuration}
                                                reduceMotion={reduceMotion}
                                                style={{ width: cardWidth }}
                                            >
                                                <Pressable
                                                    accessibilityRole="button"
                                                    accessibilityLabel={
                                                        item.title
                                                    }
                                                    onPress={() =>
                                                        setSheetState({
                                                            kind: "direction",
                                                            direction: {
                                                                title: item.title,
                                                                audience:
                                                                    item.badge,
                                                                outcome:
                                                                    item.description,
                                                                focus: item.bullets,
                                                            },
                                                        })
                                                    }
                                                    style={(state) => {
                                                        const hovered =
                                                            "hovered" in
                                                                state &&
                                                            Boolean(
                                                                (
                                                                    state as {
                                                                        hovered?: boolean;
                                                                    }
                                                                ).hovered,
                                                            );

                                                        return [
                                                            styles.solutionPressable,
                                                            {
                                                                transform: [
                                                                    {
                                                                        translateY:
                                                                            hovered
                                                                                ? -4
                                                                                : 0,
                                                                    },
                                                                ],
                                                                opacity:
                                                                    state.pressed
                                                                        ? 0.96
                                                                        : 1,
                                                            },
                                                        ];
                                                    }}
                                                >
                                                    <AppCard
                                                        tone={
                                                            index % 2 === 0
                                                                ? "mint"
                                                                : "default"
                                                        }
                                                        style={
                                                            styles.solutionCard
                                                        }
                                                    >
                                                        <StatusPill
                                                            label={item.badge}
                                                            tone="neutral"
                                                        />
                                                        <Text
                                                            style={[
                                                                styles.cardTitle,
                                                                {
                                                                    color: theme
                                                                        .semantic
                                                                        .textPrimary,
                                                                },
                                                            ]}
                                                        >
                                                            {item.title}
                                                        </Text>
                                                        <Text
                                                            style={[
                                                                styles.bodyText,
                                                                {
                                                                    color: theme
                                                                        .semantic
                                                                        .textSecondary,
                                                                },
                                                            ]}
                                                        >
                                                            {item.description}
                                                        </Text>
                                                        <View
                                                            style={
                                                                styles.bulletList
                                                            }
                                                        >
                                                            {item.bullets.map(
                                                                (bullet) => (
                                                                    <View
                                                                        key={
                                                                            bullet
                                                                        }
                                                                        style={
                                                                            styles.bulletRow
                                                                        }
                                                                    >
                                                                        <View
                                                                            style={[
                                                                                styles.bulletDot,
                                                                                {
                                                                                    backgroundColor:
                                                                                        theme
                                                                                            .semantic
                                                                                            .actionPrimary,
                                                                                },
                                                                            ]}
                                                                        />
                                                                        <Text
                                                                            style={[
                                                                                styles.bulletText,
                                                                                {
                                                                                    color: theme
                                                                                        .semantic
                                                                                        .textPrimary,
                                                                                },
                                                                            ]}
                                                                        >
                                                                            {
                                                                                bullet
                                                                            }
                                                                        </Text>
                                                                    </View>
                                                                ),
                                                            )}
                                                        </View>
                                                    </AppCard>
                                                </Pressable>
                                            </Reveal>
                                        ),
                                    )}
                                </View>
                            </View>
                        </Reveal>
                    </View>

                    <View
                        onLayout={registerSection("howItWorks")}
                        style={[
                            styles.sectionAnchor,
                            isMobile && styles.sectionAnchorMobile,
                        ]}
                    >
                        <Reveal
                            delay={260}
                            distance={motionDistance}
                            duration={motionDuration}
                            reduceMotion={reduceMotion}
                        >
                            <View
                                style={[
                                    styles.trainerSection,
                                    isDesktop && styles.trainerDesktop,
                                    isMobile && styles.trainerSectionMobile,
                                ]}
                            >
                                <View style={styles.trainerCopy}>
                                    <Text
                                        style={[
                                            styles.sectionTitle,
                                            sectionTitleStyle,
                                            {
                                                color: theme.semantic
                                                    .textPrimary,
                                            },
                                        ]}
                                    >
                                        {landingContent.trainerTitle}
                                    </Text>
                                    <View style={styles.trainerList}>
                                        {landingContent.trainerItems.map(
                                            (item, index) => (
                                                <TriggeredReveal
                                                    key={item.title}
                                                    active={isSectionRevealActive(
                                                        "howItWorks",
                                                        isMobile ? 60 : 110,
                                                    )}
                                                    delay={index * 140}
                                                    duration={
                                                        isMobile ? 760 : 980
                                                    }
                                                    distance={
                                                        isMobile ? 18 : 52
                                                    }
                                                    variant="left"
                                                    reduceMotion={reduceMotion}
                                                >
                                                    <View
                                                        style={[
                                                            styles.trainerListRow,
                                                            {
                                                                borderColor:
                                                                    theme
                                                                        .semantic
                                                                        .borderSubtle,
                                                            },
                                                        ]}
                                                    >
                                                        <View
                                                            style={[
                                                                styles.trainerListBadge,
                                                                {
                                                                    backgroundColor:
                                                                        theme
                                                                            .colors
                                                                            .primaryPale,
                                                                },
                                                            ]}
                                                        >
                                                            <Text
                                                                style={[
                                                                    styles.trainerListBadgeText,
                                                                    {
                                                                        color: theme
                                                                            .semantic
                                                                            .actionSecondaryText,
                                                                    },
                                                                ]}
                                                            >
                                                                {`0${index + 1}`}
                                                            </Text>
                                                        </View>
                                                        <View
                                                            style={
                                                                styles.trainerListCopy
                                                            }
                                                        >
                                                            <Text
                                                                style={[
                                                                    styles.cardTitle,
                                                                    {
                                                                        color: theme
                                                                            .semantic
                                                                            .textPrimary,
                                                                    },
                                                                ]}
                                                            >
                                                                {item.title}
                                                            </Text>
                                                            <Text
                                                                style={[
                                                                    styles.bodyText,
                                                                    {
                                                                        color: theme
                                                                            .semantic
                                                                            .textSecondary,
                                                                    },
                                                                ]}
                                                            >
                                                                {
                                                                    item.description
                                                                }
                                                            </Text>
                                                        </View>
                                                    </View>
                                                </TriggeredReveal>
                                            ),
                                        )}
                                    </View>
                                </View>

                                <TriggeredReveal
                                    active={isSectionRevealActive(
                                        "howItWorks",
                                        isMobile ? 120 : 230,
                                    )}
                                    delay={90}
                                    duration={isMobile ? 760 : 980}
                                    distance={isMobile ? 18 : 56}
                                    variant="right"
                                    reduceMotion={reduceMotion}
                                    style={[
                                        styles.trainerMockWrap,
                                        isMobile &&
                                            styles.trainerMockWrapMobile,
                                    ]}
                                >
                                    <AppCard
                                        style={[
                                            styles.trainerMockCard,
                                            isMobile &&
                                                styles.trainerMockCardMobile,
                                        ]}
                                    >
                                        <View style={styles.mockWindowHeader}>
                                            <Text
                                                style={[
                                                    styles.mockWindowTitle,
                                                    {
                                                        color: theme.semantic
                                                            .textPrimary,
                                                    },
                                                ]}
                                            >
                                                Сценарий: возражение по обучению
                                            </Text>
                                            <View
                                                style={[
                                                    styles.mockWindowPill,
                                                    {
                                                        backgroundColor:
                                                            theme.colors
                                                                .primaryPale,
                                                    },
                                                ]}
                                            >
                                                <Text
                                                    style={[
                                                        styles.mockWindowPillText,
                                                        {
                                                            color: theme
                                                                .semantic
                                                                .actionSecondaryText,
                                                        },
                                                    ]}
                                                >
                                                    Индивидуальный отчёт
                                                </Text>
                                            </View>
                                        </View>

                                        <View style={styles.mockChatColumn}>
                                            <View
                                                style={[
                                                    styles.mockBubble,
                                                    isMobile &&
                                                        styles.mockBubbleMobile,
                                                    styles.mockBubbleClient,
                                                    {
                                                        backgroundColor:
                                                            theme.semantic
                                                                .cardSubtle,
                                                    },
                                                ]}
                                            >
                                                <Text
                                                    style={[
                                                        styles.mockBubbleRole,
                                                        {
                                                            color: theme
                                                                .semantic
                                                                .textMuted,
                                                        },
                                                    ]}
                                                >
                                                    Клиент
                                                </Text>
                                                <Text
                                                    style={[
                                                        styles.mockBubbleText,
                                                        {
                                                            color: theme
                                                                .semantic
                                                                .textPrimary,
                                                        },
                                                    ]}
                                                >
                                                    У нас уже был курс, но
                                                    продавцы всё равно теряются
                                                    в реальном разговоре.
                                                </Text>
                                            </View>
                                            <View
                                                style={[
                                                    styles.mockBubble,
                                                    isMobile &&
                                                        styles.mockBubbleMobile,
                                                    styles.mockBubbleManager,
                                                    {
                                                        backgroundColor:
                                                            theme.colors
                                                                .primaryPale,
                                                        borderColor:
                                                            theme.semantic
                                                                .border,
                                                    },
                                                ]}
                                            >
                                                <Text
                                                    style={[
                                                        styles.mockBubbleRole,
                                                        {
                                                            color: theme
                                                                .semantic
                                                                .actionSecondaryText,
                                                        },
                                                    ]}
                                                >
                                                    Менеджер
                                                </Text>
                                                <Text
                                                    style={[
                                                        styles.mockBubbleText,
                                                        {
                                                            color: theme
                                                                .semantic
                                                                .textPrimary,
                                                        },
                                                    ]}
                                                >
                                                    Правильно понимаю, что
                                                    команде не хватает именно
                                                    регулярной практики и
                                                    понятной обратной связи?
                                                </Text>
                                            </View>
                                        </View>

                                        <View
                                            style={[
                                                styles.feedbackPanel,
                                                isMobile &&
                                                    styles.feedbackPanelMobile,
                                                {
                                                    backgroundColor:
                                                        theme.semantic
                                                            .cardSubtle,
                                                },
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.feedbackTitle,
                                                    {
                                                        color: theme.semantic
                                                            .textPrimary,
                                                    },
                                                ]}
                                            >
                                                Оценка по компетенциям
                                            </Text>
                                            <View
                                                style={[
                                                    styles.feedbackScores,
                                                    isMobile &&
                                                        styles.feedbackScoresMobile,
                                                ]}
                                            >
                                                <FeedbackScore
                                                    label="Диагностика"
                                                    value={72}
                                                />
                                                <FeedbackScore
                                                    label="Аргументация"
                                                    value={84}
                                                />
                                                <FeedbackScore
                                                    label="Следующий шаг"
                                                    value={67}
                                                />
                                            </View>
                                            <View
                                                style={[
                                                    styles.feedbackColumns,
                                                    isMobile &&
                                                        styles.feedbackColumnsMobile,
                                                ]}
                                            >
                                                <View
                                                    style={[
                                                        styles.feedbackColumn,
                                                        isMobile &&
                                                            styles.feedbackColumnMobile,
                                                        {
                                                            borderColor:
                                                                theme.semantic
                                                                    .border,
                                                        },
                                                    ]}
                                                >
                                                    <Text
                                                        style={[
                                                            styles.feedbackColumnTitle,
                                                            {
                                                                color: theme
                                                                    .semantic
                                                                    .textPrimary,
                                                            },
                                                        ]}
                                                    >
                                                        Сильные стороны
                                                    </Text>
                                                    <Text
                                                        style={[
                                                            styles.feedbackColumnText,
                                                            {
                                                                color: theme
                                                                    .semantic
                                                                    .textSecondary,
                                                            },
                                                        ]}
                                                    >
                                                        Уточнил проблему клиента
                                                        и удержал фокус на
                                                        рабочем процессе
                                                        команды.
                                                    </Text>
                                                </View>
                                                <View
                                                    style={[
                                                        styles.feedbackColumn,
                                                        isMobile &&
                                                            styles.feedbackColumnMobile,
                                                        {
                                                            borderColor:
                                                                theme.semantic
                                                                    .border,
                                                        },
                                                    ]}
                                                >
                                                    <Text
                                                        style={[
                                                            styles.feedbackColumnTitle,
                                                            {
                                                                color: theme
                                                                    .semantic
                                                                    .textPrimary,
                                                            },
                                                        ]}
                                                    >
                                                        Что улучшить
                                                    </Text>
                                                    <Text
                                                        style={[
                                                            styles.feedbackColumnText,
                                                            {
                                                                color: theme
                                                                    .semantic
                                                                    .textSecondary,
                                                            },
                                                        ]}
                                                    >
                                                        Сильнее связать
                                                        следующую реплику с
                                                        последствиями для
                                                        конверсии и адаптации.
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                    </AppCard>
                                </TriggeredReveal>
                            </View>
                        </Reveal>
                    </View>

                    <View
                        onLayout={registerSection("directions")}
                        style={styles.sectionAnchor}
                    >
                        <Reveal
                            delay={300}
                            distance={motionDistance}
                            duration={motionDuration}
                            reduceMotion={reduceMotion}
                        >
                            <View style={styles.sectionStack}>
                                <View style={styles.sectionHeading}>
                                    <Text
                                        style={[
                                            styles.sectionTitle,
                                            sectionTitleStyle,
                                            {
                                                color: theme.semantic
                                                    .textPrimary,
                                            },
                                        ]}
                                    >
                                        {landingContent.directionsTitle}
                                    </Text>
                                </View>

                                {!layout.isMobile ? (
                                    <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        contentContainerStyle={
                                            styles.trackScroller
                                        }
                                    >
                                        {landingContent.directions.map(
                                            (direction, index) => (
                                                <Reveal
                                                    key={direction.title}
                                                    delay={320 + index * 50}
                                                    distance={motionDistance}
                                                    duration={motionDuration}
                                                    reduceMotion={reduceMotion}
                                                >
                                                    <Pressable
                                                        accessibilityRole="button"
                                                        accessibilityLabel={
                                                            direction.title
                                                        }
                                                        onPress={() =>
                                                            setSheetState({
                                                                kind: "direction",
                                                                direction,
                                                            })
                                                        }
                                                        style={(state) => {
                                                            const hovered =
                                                                "hovered" in
                                                                    state &&
                                                                Boolean(
                                                                    (
                                                                        state as {
                                                                            hovered?: boolean;
                                                                        }
                                                                    ).hovered,
                                                                );

                                                            return [
                                                                styles.trackCardPressable,
                                                                {
                                                                    transform: [
                                                                        {
                                                                            translateY:
                                                                                hovered
                                                                                    ? -6
                                                                                    : 0,
                                                                        },
                                                                    ],
                                                                    opacity:
                                                                        state.pressed
                                                                            ? 0.96
                                                                            : 1,
                                                                },
                                                            ];
                                                        }}
                                                    >
                                                        <AppCard
                                                            tone={
                                                                index % 2 === 0
                                                                    ? "mint"
                                                                    : "default"
                                                            }
                                                            style={
                                                                styles.trackCard
                                                            }
                                                        >
                                                            <Text
                                                                style={[
                                                                    styles.trackLabel,
                                                                    {
                                                                        color: theme
                                                                            .semantic
                                                                            .actionPrimary,
                                                                    },
                                                                ]}
                                                            >
                                                                {
                                                                    direction.title
                                                                }
                                                            </Text>
                                                            <Text
                                                                style={[
                                                                    styles.trackAudience,
                                                                    {
                                                                        color: theme
                                                                            .semantic
                                                                            .textSecondary,
                                                                    },
                                                                ]}
                                                            >
                                                                {
                                                                    direction.audience
                                                                }
                                                            </Text>
                                                            <Text
                                                                style={[
                                                                    styles.trackOutcome,
                                                                    {
                                                                        color: theme
                                                                            .semantic
                                                                            .textPrimary,
                                                                    },
                                                                ]}
                                                            >
                                                                {
                                                                    direction.outcome
                                                                }
                                                            </Text>
                                                            <View
                                                                style={
                                                                    styles.trackFocusList
                                                                }
                                                            >
                                                                {direction.focus.map(
                                                                    (item) => (
                                                                        <Text
                                                                            key={
                                                                                item
                                                                            }
                                                                            style={[
                                                                                styles.trackFocusItem,
                                                                                {
                                                                                    color: theme
                                                                                        .semantic
                                                                                        .textSecondary,
                                                                                },
                                                                            ]}
                                                                        >
                                                                            •{" "}
                                                                            {
                                                                                item
                                                                            }
                                                                        </Text>
                                                                    ),
                                                                )}
                                                            </View>
                                                        </AppCard>
                                                    </Pressable>
                                                </Reveal>
                                            ),
                                        )}
                                    </ScrollView>
                                ) : (
                                    <View style={styles.trackMobileGrid}>
                                        {landingContent.directions.map(
                                            (direction, index) => (
                                                <Reveal
                                                    key={direction.title}
                                                    delay={320 + index * 50}
                                                    distance={motionDistance}
                                                    duration={motionDuration}
                                                    reduceMotion={reduceMotion}
                                                >
                                                    <Pressable
                                                        accessibilityRole="button"
                                                        accessibilityLabel={
                                                            direction.title
                                                        }
                                                        onPress={() =>
                                                            setSheetState({
                                                                kind: "direction",
                                                                direction,
                                                            })
                                                        }
                                                    >
                                                        <AppCard
                                                            tone={
                                                                index % 2 === 0
                                                                    ? "mint"
                                                                    : "default"
                                                            }
                                                            style={
                                                                styles.trackCardMobile
                                                            }
                                                        >
                                                            <Text
                                                                style={[
                                                                    styles.trackLabel,
                                                                    {
                                                                        color: theme
                                                                            .semantic
                                                                            .actionPrimary,
                                                                    },
                                                                ]}
                                                            >
                                                                {
                                                                    direction.title
                                                                }
                                                            </Text>
                                                            <Text
                                                                style={[
                                                                    styles.trackAudience,
                                                                    {
                                                                        color: theme
                                                                            .semantic
                                                                            .textSecondary,
                                                                    },
                                                                ]}
                                                            >
                                                                {
                                                                    direction.audience
                                                                }
                                                            </Text>
                                                            <Text
                                                                style={[
                                                                    styles.trackOutcome,
                                                                    {
                                                                        color: theme
                                                                            .semantic
                                                                            .textPrimary,
                                                                    },
                                                                ]}
                                                            >
                                                                {
                                                                    direction.outcome
                                                                }
                                                            </Text>
                                                            <View
                                                                style={
                                                                    styles.trackFocusList
                                                                }
                                                            >
                                                                {direction.focus.map(
                                                                    (item) => (
                                                                        <Text
                                                                            key={
                                                                                item
                                                                            }
                                                                            style={[
                                                                                styles.trackFocusItem,
                                                                                {
                                                                                    color: theme
                                                                                        .semantic
                                                                                        .textSecondary,
                                                                                },
                                                                            ]}
                                                                        >
                                                                            •{" "}
                                                                            {
                                                                                item
                                                                            }
                                                                        </Text>
                                                                    ),
                                                                )}
                                                            </View>
                                                        </AppCard>
                                                    </Pressable>
                                                </Reveal>
                                            ),
                                        )}
                                    </View>
                                )}
                            </View>
                        </Reveal>
                    </View>

                    <View
                        onLayout={registerSection("result")}
                        style={styles.sectionAnchor}
                    >
                        <Reveal
                            delay={340}
                            distance={motionDistance}
                            duration={motionDuration}
                            reduceMotion={reduceMotion}
                        >
                            <View style={styles.sectionStack}>
                                <View style={styles.sectionHeading}>
                                    <Text
                                        style={[
                                            styles.sectionTitle,
                                            sectionTitleStyle,
                                            {
                                                color: theme.semantic
                                                    .textPrimary,
                                            },
                                        ]}
                                    >
                                        {landingContent.resultTitle}
                                    </Text>
                                </View>
                                <View style={styles.resultGrid}>
                                    {landingContent.resultStages.map(
                                        (stage, index) => (
                                            <Reveal
                                                key={stage.title}
                                                delay={360 + index * 55}
                                                distance={motionDistance}
                                                duration={motionDuration}
                                                reduceMotion={reduceMotion}
                                                style={{ width: stageWidth }}
                                            >
                                                <AppCard
                                                    tone={
                                                        index % 2 === 0
                                                            ? "default"
                                                            : "mint"
                                                    }
                                                    style={styles.resultCard}
                                                >
                                                    <Text
                                                        style={[
                                                            styles.resultCardIndex,
                                                            {
                                                                color: theme
                                                                    .semantic
                                                                    .actionPrimary,
                                                            },
                                                        ]}
                                                    >{`0${index + 1}`}</Text>
                                                    <Text
                                                        style={[
                                                            styles.cardTitle,
                                                            {
                                                                color: theme
                                                                    .semantic
                                                                    .textPrimary,
                                                            },
                                                        ]}
                                                    >
                                                        {stage.title}
                                                    </Text>
                                                    <Text
                                                        style={[
                                                            styles.bodyText,
                                                            {
                                                                color: theme
                                                                    .semantic
                                                                    .textSecondary,
                                                            },
                                                        ]}
                                                    >
                                                        {stage.description}
                                                    </Text>
                                                </AppCard>
                                            </Reveal>
                                        ),
                                    )}
                                </View>
                                <View style={styles.resultPillsRow}>
                                    {landingContent.resultPills.map((pill) => (
                                        <View
                                            key={pill}
                                            style={[
                                                styles.resultPill,
                                                {
                                                    borderColor:
                                                        theme.semantic.border,
                                                    backgroundColor:
                                                        "rgba(255,255,255,0.72)",
                                                },
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.resultPillText,
                                                    {
                                                        color: theme.semantic
                                                            .textPrimary,
                                                    },
                                                ]}
                                            >
                                                {pill}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        </Reveal>
                    </View>

                    <Reveal
                        delay={380}
                        distance={motionDistance}
                        duration={motionDuration}
                        reduceMotion={reduceMotion}
                    >
                        <View
                            style={[
                                styles.securitySection,
                                isMobile && styles.securitySectionMobile,
                                {
                                    backgroundColor: theme.colors.primaryDeep,
                                    borderColor: theme.colors.primary,
                                },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.securityTitle,
                                    securityTitleStyle,
                                ]}
                            >
                                {landingContent.securityTitle}
                            </Text>
                            <View style={styles.securityGrid}>
                                {landingContent.securityItems.map(
                                    (item, index) => (
                                        <Reveal
                                            key={item.title}
                                            delay={400 + index * 60}
                                            distance={motionDistance}
                                            duration={motionDuration}
                                            reduceMotion={reduceMotion}
                                            style={{ width: cardWidth }}
                                        >
                                            <View
                                                style={[
                                                    styles.securityCard,
                                                    {
                                                        borderColor:
                                                            "rgba(216, 230, 221, 0.18)",
                                                        backgroundColor:
                                                            "rgba(255,255,255,0.08)",
                                                    },
                                                ]}
                                            >
                                                <Text
                                                    style={
                                                        styles.securityCardTitle
                                                    }
                                                >
                                                    {item.title}
                                                </Text>
                                                <Text
                                                    style={
                                                        styles.securityCardText
                                                    }
                                                >
                                                    {item.description}
                                                </Text>
                                            </View>
                                        </Reveal>
                                    ),
                                )}
                            </View>
                        </View>
                    </Reveal>

                    <Reveal
                        delay={430}
                        distance={motionDistance}
                        duration={motionDuration}
                        reduceMotion={reduceMotion}
                    >
                        <View
                            style={[
                                styles.finalSection,
                                isMobile && styles.finalSectionMobile,
                                {
                                    borderColor: theme.semantic.border,
                                    backgroundColor: theme.semantic.card,
                                },
                            ]}
                        >
                            <View
                                style={[
                                    styles.finalGlow,
                                    isMobile && styles.finalGlowMobile,
                                    { backgroundColor: theme.colors.mintGlow },
                                ]}
                            />
                            <Text
                                style={[
                                    styles.finalTitle,
                                    finalTitleStyle,
                                    { color: theme.semantic.textPrimary },
                                ]}
                            >
                                {landingContent.finalTitle}
                            </Text>
                            <Text
                                style={[
                                    styles.finalDescription,
                                    { color: theme.semantic.textSecondary },
                                ]}
                            >
                                {landingContent.finalDescription}
                            </Text>
                            <View
                                style={[
                                    styles.heroActions,
                                    isMobile
                                        ? styles.heroActionsMobile
                                        : styles.heroActionsDesktop,
                                ]}
                            >
                                <AppButton
                                    label={landingContent.finalSecondaryCta}
                                    onPress={() =>
                                        openCtaSheet("implementation")
                                    }
                                    tone="secondary"
                                    {...compactButtonProps}
                                />
                            </View>
                        </View>
                    </Reveal>

                    <View style={styles.footerSpace}>
                        <Text
                            style={[
                                styles.footerText,
                                { color: theme.semantic.textMuted },
                            ]}
                        >
                            AI Sales Academy
                        </Text>
                    </View>
                </View>
            </ScrollView>

            <AppBottomSheet
                visible={sheetState !== null}
                title={ctaTitle}
                description={ctaDescription}
                onClose={() => setSheetState(null)}
            >
                {sheetState?.kind === "direction" ? (
                    <>
                        <View
                            style={[
                                styles.directionSheetMeta,
                                {
                                    borderColor: theme.semantic.border,
                                    backgroundColor: theme.semantic.cardSubtle,
                                },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.directionSheetAudience,
                                    { color: theme.semantic.textSecondary },
                                ]}
                            >
                                {sheetState.direction.audience}
                            </Text>
                            <Text
                                style={[
                                    styles.directionSheetOutcome,
                                    { color: theme.semantic.textPrimary },
                                ]}
                            >
                                {sheetState.direction.outcome}
                            </Text>
                        </View>
                        <View style={styles.trackFocusList}>
                            {sheetState.direction.focus.map((item) => (
                                <Text
                                    key={item}
                                    style={[
                                        styles.trackFocusItem,
                                        { color: theme.semantic.textSecondary },
                                    ]}
                                >
                                    • {item}
                                </Text>
                            ))}
                        </View>
                        <AppButton
                            label="Обсудить на демо"
                            onPress={() => {
                                setSubmittedKind(null);
                                setSheetState({ kind: "demo" });
                            }}
                            tone="primary"
                            fullWidth
                        />
                    </>
                ) : (
                    <>
                        <TextInput
                            value={contactName}
                            onChangeText={setContactName}
                            placeholder="Ваше имя"
                            placeholderTextColor={theme.semantic.textMuted}
                            style={[
                                styles.input,
                                {
                                    borderColor: theme.semantic.border,
                                    backgroundColor: theme.semantic.cardSubtle,
                                    color: theme.semantic.textPrimary,
                                },
                            ]}
                        />
                        <TextInput
                            value={contactCompany}
                            onChangeText={setContactCompany}
                            placeholder="Компания"
                            placeholderTextColor={theme.semantic.textMuted}
                            style={[
                                styles.input,
                                {
                                    borderColor: theme.semantic.border,
                                    backgroundColor: theme.semantic.cardSubtle,
                                    color: theme.semantic.textPrimary,
                                },
                            ]}
                        />
                        <TextInput
                            value={contactGoal}
                            onChangeText={setContactGoal}
                            placeholder={
                                actionSheetKind === "implementation"
                                    ? "Что важно учесть при внедрении"
                                    : "Какую задачу в продажах хотите улучшить"
                            }
                            placeholderTextColor={theme.semantic.textMuted}
                            multiline
                            style={[
                                styles.input,
                                styles.textarea,
                                {
                                    borderColor: theme.semantic.border,
                                    backgroundColor: theme.semantic.cardSubtle,
                                    color: theme.semantic.textPrimary,
                                },
                            ]}
                        />

                        {submittedKind === actionSheetKind ? (
                            <AppCard tone="mint">
                                <Text
                                    style={[
                                        styles.bodyText,
                                        { color: theme.semantic.textPrimary },
                                    ]}
                                >
                                    {actionSheetKind === "implementation"
                                        ? "Запрос на внедрение сохранён локально. Ниже можно открыть один из демонстрационных контуров."
                                        : "Запрос на демо сохранён локально. Ниже можно сразу открыть демонстрационный контур продукта."}
                                </Text>
                                <View style={styles.demoRoleGrid}>
                                    {roleOptions.map((option) => (
                                        <AppButton
                                            key={option.role}
                                            label={option.title}
                                            onPress={() => {
                                                setSheetState(null);
                                                onEnterRole(option.role);
                                            }}
                                            tone="secondary"
                                        />
                                    ))}
                                </View>
                            </AppCard>
                        ) : null}

                        <AppButton
                            label={
                                actionSheetKind === "implementation"
                                    ? "Сохранить задачу внедрения"
                                    : "Сохранить запрос на демо"
                            }
                            onPress={() => setSubmittedKind(actionSheetKind)}
                            tone="primary"
                            fullWidth
                        />
                    </>
                )}
            </AppBottomSheet>
        </SafeAreaView>
    );
}

function MetricBar({ value }: { value: number }) {
    const theme = useTheme();

    return (
        <View
            style={[
                styles.metricBarTrack,
                { backgroundColor: theme.semantic.borderSubtle },
            ]}
        >
            <View
                style={[
                    styles.metricBarFill,
                    {
                        width: `${value}%`,
                        backgroundColor: theme.semantic.actionPrimary,
                    },
                ]}
            />
        </View>
    );
}

function FeedbackScore({ label, value }: { label: string; value: number }) {
    const theme = useTheme();

    return (
        <View
            style={[
                styles.feedbackScoreCard,
                { borderColor: theme.semantic.border },
            ]}
        >
            <Text
                style={[
                    styles.feedbackScoreLabel,
                    { color: theme.semantic.textMuted },
                ]}
            >
                {label}
            </Text>
            <Text
                style={[
                    styles.feedbackScoreValue,
                    { color: theme.semantic.textPrimary },
                ]}
            >
                {value}
            </Text>
            <MetricBar value={value} />
        </View>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 42,
    },
    stickyHeader: {
        borderBottomWidth: 1,
        paddingTop: 8,
        paddingBottom: 10,
        zIndex: 20,
    },
    container: {
        width: "100%",
        alignSelf: "center",
    },
    headerSurface: {
        borderWidth: 1,
        borderRadius: 28,
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    headerSurfaceMobile: {
        borderRadius: 24,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    headerSurfaceMobileLayered: {
        position: "relative",
        overflow: "visible",
    },
    headerTopRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 18,
    },
    headerTopRowMobile: {
        minHeight: 44,
    },
    brandBlock: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        minWidth: 0,
    },
    brandMark: {
        width: 42,
        height: 42,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    brandMarkText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "800",
    },
    brandTextBlock: {
        gap: 2,
        minWidth: 0,
    },
    brandTitle: {
        fontSize: 18,
        lineHeight: 22,
        fontWeight: "800",
        flexShrink: 1,
    },
    brandTitleSmallMobile: {
        fontSize: 16,
        lineHeight: 20,
    },
    brandSubtitle: {
        fontSize: 12,
        lineHeight: 16,
        fontWeight: "600",
        textTransform: "uppercase",
        letterSpacing: 1.4,
    },
    brandSubtitleMobile: {
        display: "none",
    },
    headerActions: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
    },
    headerActionsHiddenMobile: {
        display: "none",
    },
    navRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        flexWrap: "wrap",
        justifyContent: "center",
    },
    navRowMobile: {
        justifyContent: "flex-start",
    },
    navChip: {
        borderWidth: 1,
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    navChipText: {
        fontSize: 14,
        lineHeight: 18,
        fontWeight: "700",
    },
    menuButton: {
        width: 44,
        height: 44,
        borderWidth: 1,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
    },
    menuButtonBar: {
        width: 18,
        height: 2,
        borderRadius: 999,
    },
    mobileMenuDropdown: {
        position: "absolute",
        top: 68,
        left: 14,
        right: 14,
        borderWidth: 1,
        borderRadius: 22,
        paddingHorizontal: 14,
        paddingVertical: 14,
        zIndex: 40,
    },
    mobileMenuActions: {
        gap: 12,
    },
    mobileMenuNavList: {
        gap: 10,
    },
    mobileMenuNavItem: {
        borderWidth: 1,
        borderRadius: 18,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    mobileMenuNavText: {
        fontSize: 15,
        lineHeight: 20,
        fontWeight: "700",
    },
    mobileMenuButtonColumn: {
        gap: 10,
    },
    heroSection: {
        paddingTop: 26,
        paddingBottom: 28,
        gap: 22,
    },
    heroSectionMobile: {
        paddingTop: 18,
        paddingBottom: 22,
        gap: 18,
    },
    heroDesktop: {
        flexDirection: "row",
        alignItems: "center",
    },
    heroCopy: {
        flex: 1,
        gap: 16,
    },
    heroCopyMobile: {
        gap: 14,
    },
    heroTitle: {
        fontSize: 52,
        lineHeight: 56,
        fontWeight: "800",
        letterSpacing: -1.8,
    },
    heroTitleMobile: {
        fontSize: 40,
        lineHeight: 44,
        letterSpacing: -1.3,
    },
    heroTitleSmallMobile: {
        fontSize: 34,
        lineHeight: 38,
        letterSpacing: -1,
    },
    heroDescription: {
        maxWidth: 640,
        fontSize: 18,
        lineHeight: 28,
    },
    heroDescriptionMobile: {
        fontSize: 16,
        lineHeight: 24,
    },
    heroActions: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
    },
    heroActionsDesktop: {
        alignItems: "center",
    },
    heroActionsMobile: {
        flexDirection: "column",
        alignItems: "stretch",
    },
    heroVisualWrap: {
        flex: 0.92,
        minHeight: 420,
        justifyContent: "center",
    },
    heroVisualWrapMobile: {
        minHeight: 0,
    },
    heroVisualCard: {
        overflow: "hidden",
        minHeight: 420,
        padding: 24,
        gap: 18,
    },
    heroVisualCardMobile: {
        minHeight: 0,
        padding: 18,
        gap: 14,
    },
    heroGlow: {
        position: "absolute",
        top: 44,
        right: 18,
        width: 220,
        height: 220,
        borderRadius: 220,
        opacity: 0.28,
    },
    heroGlowMobile: {
        top: 28,
        right: 12,
        width: 140,
        height: 140,
        borderRadius: 140,
        opacity: 0.16,
    },
    heroMockHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
    },
    scoreBadge: {
        borderRadius: 999,
        paddingHorizontal: 14,
        paddingVertical: 8,
    },
    scoreBadgeLabel: {
        fontSize: 13,
        lineHeight: 18,
        fontWeight: "800",
    },
    mockChatColumn: {
        gap: 12,
    },
    mockBubble: {
        maxWidth: "88%",
        borderRadius: 22,
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 6,
    },
    mockBubbleMobile: {
        maxWidth: "100%",
        borderRadius: 18,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    mockBubbleClient: {
        alignSelf: "flex-start",
    },
    mockBubbleManager: {
        alignSelf: "flex-end",
        borderWidth: 1,
    },
    mockBubbleRole: {
        fontSize: 12,
        lineHeight: 16,
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    mockBubbleText: {
        fontSize: 15,
        lineHeight: 22,
    },
    mockStatsRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
    },
    mockStatsRowMobile: {
        gap: 10,
    },
    mockStatCard: {
        flex: 1,
        minWidth: 160,
        borderRadius: 20,
        padding: 14,
        gap: 10,
    },
    mockStatCardMobile: {
        minWidth: "100%",
        borderRadius: 18,
        padding: 12,
    },
    mockStatLabel: {
        fontSize: 13,
        lineHeight: 18,
        fontWeight: "700",
    },
    metricBarTrack: {
        height: 8,
        borderRadius: 999,
        overflow: "hidden",
    },
    metricBarFill: {
        height: "100%",
        borderRadius: 999,
    },
    progressPanel: {
        borderWidth: 1,
        borderRadius: 22,
        padding: 16,
        gap: 10,
    },
    progressPanelMobile: {
        borderRadius: 18,
        padding: 14,
    },
    progressTitle: {
        fontSize: 15,
        lineHeight: 20,
        fontWeight: "700",
    },
    progressCaption: {
        fontSize: 14,
        lineHeight: 21,
    },
    sectionStack: {
        paddingTop: 12,
        paddingBottom: 18,
        gap: 20,
    },
    metricSectionMobile: {
        paddingTop: 40,
    },
    sectionHeading: {
        gap: 10,
    },
    sectionEyebrow: {
        fontSize: 12,
        lineHeight: 16,
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: 1.8,
    },
    sectionTitle: {
        fontSize: 38,
        lineHeight: 42,
        fontWeight: "800",
        letterSpacing: -1.2,
    },
    sectionTitleMobile: {
        fontSize: 32,
        lineHeight: 36,
        letterSpacing: -1,
    },
    sectionTitleSmallMobile: {
        fontSize: 28,
        lineHeight: 32,
        letterSpacing: -0.8,
    },
    sectionLead: {
        maxWidth: 780,
        fontSize: 17,
        lineHeight: 27,
    },
    metricGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 14,
    },
    metricCard: {
        minHeight: 214,
    },
    metricValue: {
        fontSize: 34,
        lineHeight: 38,
        fontWeight: "800",
    },
    metricLabel: {
        fontSize: 20,
        lineHeight: 26,
        fontWeight: "700",
    },
    metricCaption: {
        fontSize: 14,
        lineHeight: 21,
    },
    sectionAnchor: {
        paddingTop: 10,
    },
    sectionAnchorMobile: {
        paddingTop: 40,
    },
    problemSection: {
        gap: 18,
    },
    problemSectionMobile: {
        gap: 20,
    },
    problemDesktop: {
        flexDirection: "row",
        alignItems: "stretch",
    },
    problemListColumn: {
        flex: 1.08,
        gap: 14,
    },
    problemList: {
        gap: 12,
    },
    problemCard: {
        gap: 10,
    },
    problemCardHeader: {
        flexDirection: "row",
        gap: 12,
        alignItems: "center",
    },
    problemIndex: {
        width: 38,
        height: 38,
        borderRadius: 13,
        alignItems: "center",
        justifyContent: "center",
    },
    problemIndexText: {
        fontSize: 13,
        lineHeight: 16,
        fontWeight: "800",
    },
    problemAccentWrap: {
        flex: 0.86,
    },
    problemAccentWrapMobile: {
        flexGrow: 0,
        flexShrink: 0,
        flexBasis: "auto",
        width: "100%",
        alignSelf: "stretch",
        marginTop: 16,
    },
    problemAccentCard: {
        flex: 1,
        minHeight: 340,
        borderWidth: 1,
        borderRadius: 32,
        padding: 28,
        justifyContent: "flex-end",
        overflow: "hidden",
        gap: 18,
    },
    problemAccentCardMobile: {
        flexGrow: 0,
        flexShrink: 0,
        flexBasis: "auto",
        alignSelf: "stretch",
        minHeight: 0,
        padding: 20,
        justifyContent: "flex-start",
        gap: 14,
    },
    problemAccentGlow: {
        position: "absolute",
        top: 24,
        right: 24,
        width: 180,
        height: 180,
        borderRadius: 180,
        opacity: 0.2,
    },
    problemAccentSupport: {
        borderWidth: 1,
        borderRadius: 24,
        padding: 14,
        gap: 10,
    },
    problemAccentSupportRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 10,
    },
    problemAccentSupportLead: {
        color: "rgba(255,255,255,0.88)",
        fontSize: 14,
        lineHeight: 21,
        fontWeight: "600",
        marginBottom: 4,
    },
    problemAccentSupportDot: {
        width: 8,
        height: 8,
        borderRadius: 8,
        marginTop: 8,
    },
    problemAccentSupportText: {
        flex: 1,
        color: "rgba(255,255,255,0.88)",
        fontSize: 13,
        lineHeight: 20,
        fontWeight: "700",
    },
    problemAccentCopy: {
        marginTop: "auto",
        gap: 10,
    },
    problemAccentCopyMobile: {
        marginTop: 0,
    },
    problemAccentTitle: {
        color: "#FFFFFF",
        fontSize: 34,
        lineHeight: 38,
        fontWeight: "800",
        marginBottom: 12,
    },
    problemAccentTitleMobile: {
        fontSize: 28,
        lineHeight: 32,
        marginBottom: 8,
    },
    problemAccentBody: {
        color: "rgba(255,255,255,0.84)",
        fontSize: 15,
        lineHeight: 24,
    },
    cardTitle: {
        fontSize: 22,
        lineHeight: 28,
        fontWeight: "800",
    },
    cardTitleMobile: {
        fontSize: 19,
        lineHeight: 24,
    },
    bodyText: {
        fontSize: 15,
        lineHeight: 23,
    },
    flowRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 14,
    },
    flowStepWrap: {
        width: "100%",
    },
    flowStepWrapDesktop: {
        width: "23.6%",
    },
    flowStep: {
        position: "relative",
        borderRadius: 24,
        paddingHorizontal: 18,
        paddingVertical: 14,
        backgroundColor: "rgba(255,255,255,0.62)",
    },
    flowStepIndex: {
        width: 34,
        height: 34,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 10,
    },
    flowStepIndexText: {
        fontSize: 13,
        lineHeight: 16,
        fontWeight: "800",
    },
    flowStepTitle: {
        fontSize: 18,
        lineHeight: 24,
        fontWeight: "800",
        marginBottom: 6,
    },
    flowStepDescription: {
        fontSize: 14,
        lineHeight: 21,
    },
    flowConnector: {
        position: "absolute",
        opacity: 0.55,
    },
    flowConnectorDesktop: {
        top: "50%",
        right: -10,
        width: 20,
        height: 2,
    },
    flowConnectorMobile: {
        left: 17,
        bottom: -10,
        width: 2,
        height: 20,
    },
    solutionGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 14,
    },
    solutionPressable: {
        width: "100%",
    },
    solutionCard: {
        minHeight: 270,
    },
    bulletList: {
        gap: 10,
    },
    bulletRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 10,
    },
    bulletDot: {
        width: 8,
        height: 8,
        borderRadius: 8,
        marginTop: 7,
    },
    bulletText: {
        flex: 1,
        fontSize: 14,
        lineHeight: 20,
    },
    trainerSection: {
        gap: 18,
        paddingTop: 12,
    },
    trainerSectionMobile: {
        gap: 18,
        paddingTop: 26,
    },
    trainerDesktop: {
        flexDirection: "row",
        alignItems: "stretch",
    },
    trainerCopy: {
        flex: 0.94,
        gap: 16,
    },
    trainerList: {
        gap: 10,
    },
    trainerListRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
        borderWidth: 1,
        borderRadius: 24,
        padding: 14,
    },
    trainerListBadge: {
        width: 36,
        height: 36,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    trainerListBadgeText: {
        fontSize: 13,
        lineHeight: 16,
        fontWeight: "800",
    },
    trainerListCopy: {
        flex: 1,
        gap: 6,
    },
    trainerMockWrap: {
        flex: 1,
        alignSelf: "stretch",
    },
    trainerMockWrapMobile: {
        flexGrow: 0,
        flexShrink: 0,
        flexBasis: "auto",
        width: "100%",
        alignSelf: "stretch",
        marginTop: 55,
    },
    trainerMockCard: {
        flex: 1,
        minHeight: 520,
        gap: 16,
        justifyContent: "space-between",
    },
    trainerMockCardMobile: {
        flexGrow: 0,
        flexShrink: 0,
        flexBasis: "auto",
        minHeight: 0,
        gap: 14,
        justifyContent: "flex-start",
    },
    mockWindowHeader: {
        gap: 10,
    },
    mockWindowTitle: {
        fontSize: 20,
        lineHeight: 26,
        fontWeight: "800",
    },
    mockWindowPill: {
        alignSelf: "flex-start",
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    mockWindowPillText: {
        fontSize: 12,
        lineHeight: 16,
        fontWeight: "700",
    },
    feedbackPanel: {
        borderRadius: 24,
        padding: 16,
        gap: 14,
    },
    feedbackPanelMobile: {
        borderRadius: 20,
        padding: 14,
        gap: 12,
    },
    feedbackTitle: {
        fontSize: 18,
        lineHeight: 24,
        fontWeight: "800",
    },
    feedbackScores: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
    },
    feedbackScoresMobile: {
        gap: 8,
    },
    feedbackScoreCard: {
        flex: 1,
        minWidth: 120,
        borderWidth: 1,
        borderRadius: 18,
        padding: 12,
        gap: 8,
    },
    feedbackScoreLabel: {
        fontSize: 12,
        lineHeight: 16,
        fontWeight: "700",
    },
    feedbackScoreValue: {
        fontSize: 22,
        lineHeight: 26,
        fontWeight: "800",
    },
    feedbackColumns: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
    },
    feedbackColumnsMobile: {
        gap: 8,
    },
    feedbackColumn: {
        flex: 1,
        minWidth: 180,
        borderWidth: 1,
        borderRadius: 18,
        padding: 14,
        gap: 8,
    },
    feedbackColumnMobile: {
        minWidth: "100%",
        padding: 12,
    },
    feedbackColumnTitle: {
        fontSize: 15,
        lineHeight: 20,
        fontWeight: "700",
    },
    feedbackColumnText: {
        fontSize: 14,
        lineHeight: 21,
    },
    trackScroller: {
        gap: 14,
        paddingRight: 4,
    },
    trackCardPressable: {
        width: 236,
    },
    trackCard: {
        minHeight: 290,
    },
    trackMobileGrid: {
        gap: 12,
    },
    trackCardMobile: {
        minHeight: 250,
    },
    trackLabel: {
        fontSize: 20,
        lineHeight: 24,
        fontWeight: "800",
    },
    trackAudience: {
        fontSize: 14,
        lineHeight: 20,
        fontWeight: "700",
    },
    trackOutcome: {
        fontSize: 15,
        lineHeight: 22,
        fontWeight: "700",
    },
    trackFocusList: {
        gap: 4,
    },
    trackFocusItem: {
        fontSize: 14,
        lineHeight: 20,
    },
    resultGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 14,
    },
    resultCard: {
        minHeight: 188,
    },
    resultCardIndex: {
        fontSize: 13,
        lineHeight: 16,
        fontWeight: "800",
        textTransform: "uppercase",
        letterSpacing: 1.8,
    },
    resultPillsRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
    },
    resultPill: {
        borderWidth: 1,
        borderRadius: 999,
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    resultPillText: {
        fontSize: 13,
        lineHeight: 18,
        fontWeight: "700",
    },
    securitySection: {
        marginTop: 6,
        borderWidth: 1,
        borderRadius: 34,
        padding: 24,
        gap: 18,
        overflow: "hidden",
    },
    securitySectionMobile: {
        borderRadius: 28,
        padding: 18,
        gap: 14,
    },
    securityTitle: {
        color: "#FFFFFF",
        fontSize: 34,
        lineHeight: 38,
        fontWeight: "800",
    },
    securityTitleMobile: {
        fontSize: 28,
        lineHeight: 32,
    },
    securityTitleSmallMobile: {
        fontSize: 25,
        lineHeight: 29,
    },
    securityGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 14,
    },
    securityCard: {
        borderWidth: 1,
        borderRadius: 24,
        minHeight: 148,
        padding: 16,
        gap: 10,
    },
    securityCardTitle: {
        color: "#FFFFFF",
        fontSize: 18,
        lineHeight: 22,
        fontWeight: "800",
    },
    securityCardText: {
        color: "rgba(255,255,255,0.82)",
        fontSize: 14,
        lineHeight: 21,
    },
    finalSection: {
        position: "relative",
        marginTop: 6,
        borderWidth: 1,
        borderRadius: 34,
        paddingHorizontal: 24,
        paddingVertical: 28,
        gap: 14,
        overflow: "hidden",
    },
    finalSectionMobile: {
        borderRadius: 28,
        paddingHorizontal: 18,
        paddingVertical: 22,
    },
    finalGlow: {
        position: "absolute",
        top: -30,
        right: -10,
        width: 220,
        height: 220,
        borderRadius: 220,
        opacity: 0.18,
    },
    finalGlowMobile: {
        top: -12,
        right: -20,
        width: 140,
        height: 140,
        borderRadius: 140,
        opacity: 0.12,
    },
    finalTitle: {
        maxWidth: 860,
        fontSize: 38,
        lineHeight: 42,
        fontWeight: "800",
        letterSpacing: -1.2,
    },
    finalTitleMobile: {
        fontSize: 31,
        lineHeight: 35,
        letterSpacing: -0.9,
    },
    finalTitleSmallMobile: {
        fontSize: 27,
        lineHeight: 31,
        letterSpacing: -0.7,
    },
    finalDescription: {
        maxWidth: 720,
        fontSize: 17,
        lineHeight: 26,
    },
    footerSpace: {
        paddingTop: 14,
        paddingBottom: 4,
    },
    footerText: {
        textAlign: "center",
        fontSize: 13,
        lineHeight: 18,
    },
    directionSheetMeta: {
        borderWidth: 1,
        borderRadius: 22,
        padding: 14,
        gap: 8,
    },
    directionSheetAudience: {
        fontSize: 13,
        lineHeight: 18,
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: 1.3,
    },
    directionSheetOutcome: {
        fontSize: 18,
        lineHeight: 25,
        fontWeight: "700",
    },
    input: {
        borderWidth: 1,
        borderRadius: 18,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        lineHeight: 22,
    },
    textarea: {
        minHeight: 116,
        textAlignVertical: "top",
    },
    demoRoleGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
    },
    buttonColumn: {
        gap: 10,
    },
    roleCard: {
        borderWidth: 1,
        borderRadius: 24,
        padding: 18,
        gap: 10,
    },
    roleHeader: {
        gap: 8,
    },
    roleEnterLabel: {
        fontSize: 14,
        lineHeight: 20,
        fontWeight: "700",
    },
});
