import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import type { RootStackParamList, RouteName } from "../../navigation/routes";
import { MaterialCard } from "../../components/knowledge/MaterialCard";
import { AppBottomSheet } from "../../components/ui/AppBottomSheet";
import { AppCard } from "../../components/ui/AppCard";
import { AppButton } from "../../components/ui/AppButton";
import { EmptyState } from "../../components/ui/EmptyState";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { StatusPill } from "../../components/ui/StatusPill";
import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";
import { useTheme } from "../../theme/useTheme";
import type {
  KnowledgeCategoryId,
  KnowledgeMaterial as KnowledgeMaterialEntity,
  KnowledgeSection as KnowledgeSectionEntity
} from "../../types/academy";

interface KnowledgeBaseScreenProps {
  sections: KnowledgeSectionEntity[];
  initialCategoryId?: KnowledgeCategoryId;
  initialMaterialId?: string;
  onNavigate: <T extends RouteName>(route: T, params?: RootStackParamList[T]) => void;
}

type KnowledgeSheetState =
  | { kind: "material"; material: KnowledgeMaterialEntity }
  | { kind: "simple"; material: KnowledgeMaterialEntity }
  | { kind: "example"; material: KnowledgeMaterialEntity }
  | { kind: "plan"; material: KnowledgeMaterialEntity }
  | null;

const categoryLabels: Record<KnowledgeCategoryId, string> = {
  product: "Продукт",
  sales_skills: "Навыки продаж",
  scenarios_cases: "Сценарии и кейсы",
  learning: "Обучение",
  assessment: "Оценка",
  feedback: "Обратная связь"
};

export function KnowledgeBaseScreen({
  sections,
  initialCategoryId,
  initialMaterialId,
  onNavigate
}: KnowledgeBaseScreenProps) {
  const theme = useTheme();
  const layout = useResponsiveLayout();
  const [activeCategoryId, setActiveCategoryId] = useState<KnowledgeCategoryId>(
    initialCategoryId ?? sections[0]?.categoryId ?? "product"
  );
  const [query, setQuery] = useState("");
  const [sheetState, setSheetState] = useState<KnowledgeSheetState>(null);
  const [addedMaterialIds, setAddedMaterialIds] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialCategoryId) {
      setActiveCategoryId(initialCategoryId);
    }
  }, [initialCategoryId]);

  useEffect(() => {
    if (!initialMaterialId) {
      return;
    }

    const material = sections.flatMap((section) => section.materials).find((item) => item.id === initialMaterialId);
    if (material) {
      setSheetState({ kind: "material", material });
      setActiveCategoryId(material.categoryId);
    }
  }, [initialMaterialId, sections]);

  const filteredSections = useMemo(
    () => sections.filter((section) => section.categoryId === activeCategoryId),
    [activeCategoryId, sections]
  );

  const visibleMaterials = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const materials = filteredSections.flatMap((section) => section.materials);

    if (!normalizedQuery) {
      return materials;
    }

    return materials.filter((material) =>
      [material.title, material.description, material.shortExplanation, ...material.tags]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [filteredSections, query]);

  const selectedMaterial = sheetState?.material ?? null;

  const addMaterialToPlan = (material: KnowledgeMaterialEntity) => {
    setAddedMaterialIds((current) =>
      current.includes(material.id) ? current : [...current, material.id]
    );
    setSuccessMessage(`Материал "${material.title}" добавлен в план развития.`);
  };

  const selectedSection = filteredSections[0];
  const materialWidth = layout.isWide ? "48%" : layout.isDesktop ? "48%" : "100%";

  return (
    <>
      <SectionHeader
        eyebrow="База знаний"
        title="Материалы и объяснение по теме"
        description="Выбери категорию, быстро найди нужный материал и сразу попроси более простое объяснение или пример ответа для диалога."
      />

      <AppCard tone="mint">
        <Text style={[styles.cardTitle, { color: theme.semantic.textPrimary }]}>Категории</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {(Object.keys(categoryLabels) as KnowledgeCategoryId[]).map((categoryId) => (
            <AppButton
              key={categoryId}
              label={categoryLabels[categoryId]}
              onPress={() => setActiveCategoryId(categoryId)}
              tone={categoryId === activeCategoryId ? "primary" : "ghost"}
            />
          ))}
        </ScrollView>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Поиск по материалам"
          placeholderTextColor={theme.semantic.textMuted}
          style={[
            styles.searchInput,
            {
              borderColor: theme.semantic.border,
              backgroundColor: theme.semantic.card
            }
          ]}
        />
        {selectedSection ? (
          <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>
            {selectedSection.description}
          </Text>
        ) : null}
      </AppCard>

      {successMessage ? (
        <AppCard>
          <Text style={[styles.successText, { color: theme.semantic.success }]}>{successMessage}</Text>
        </AppCard>
      ) : null}

      <AppCard>
        <StatusPill label="Спросить ИИ по материалу" tone="success" />
        <Text style={[styles.cardTitle, { color: theme.semantic.textPrimary }]}>Как использовать знания без перегруза</Text>
        <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>
          Выбирай один материал на одну практику: сначала пойми суть, затем попроси простой ответ для клиента и сразу переходи в тренажер.
        </Text>
      </AppCard>

      {visibleMaterials.length === 0 ? (
        <EmptyState
          title="Ничего не найдено"
          description="Измени поисковый запрос или переключи категорию, чтобы снова увидеть материалы."
          actionLabel="Сбросить поиск"
          onAction={() => setQuery("")}
        />
      ) : (
        <View style={[styles.materialGrid, (layout.isTablet || layout.isDesktop) && styles.materialGridWrap]}>
          {visibleMaterials.map((material) => (
            <View key={material.id} style={{ width: materialWidth }}>
              <MaterialCard
                material={material}
                onOpen={() => setSheetState({ kind: "material", material })}
                onExplainSimply={() => setSheetState({ kind: "simple", material })}
                onGiveAnswerExample={() => setSheetState({ kind: "example", material })}
                onAddToPlan={() => {
                  addMaterialToPlan(material);
                  setSheetState({ kind: "plan", material });
                }}
                onStartTraining={() =>
                  onNavigate("Simulator", {
                    materialId: material.id,
                    scenarioId: material.id === "mat-4" ? "scn-2" : "scn-1"
                  })
                }
              />
            </View>
          ))}
        </View>
      )}

      <AppBottomSheet
        visible={sheetState !== null}
        title={
          sheetState?.kind === "simple"
            ? `Краткое объяснение: ${selectedMaterial?.title ?? ""}`
            : sheetState?.kind === "example"
              ? `Пример ответа: ${selectedMaterial?.title ?? ""}`
              : sheetState?.kind === "plan"
                ? "Добавлено в план развития"
                : selectedMaterial?.title ?? ""
        }
        description={
          sheetState?.kind === "material"
            ? selectedMaterial?.description
            : sheetState?.kind === "simple"
              ? "Короткое пояснение по материалу простыми словами."
              : sheetState?.kind === "example"
                ? "Готовый пример ответа клиенту, который можно взять в тренировку."
                : sheetState?.kind === "plan"
                  ? "Материал можно использовать как основу для следующей практики."
                  : undefined
        }
        onClose={() => setSheetState(null)}
      >
        {sheetState?.kind === "material" && selectedMaterial ? (
          <>
            <StatusPill label={categoryLabels[selectedMaterial.categoryId]} tone="neutral" />
            <Text style={[styles.body, { color: theme.semantic.textPrimary }]}>
              {selectedMaterial.shortExplanation}
            </Text>
            <Text style={[styles.subTitle, { color: theme.semantic.textPrimary }]}>Краткое объяснение</Text>
            <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>
              {selectedMaterial.aiPlainExplanation}
            </Text>
            <Text style={[styles.subTitle, { color: theme.semantic.textPrimary }]}>Как применить в диалоге</Text>
            <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>
              {selectedMaterial.applyInDialogue}
            </Text>
          </>
        ) : null}

        {sheetState?.kind === "simple" && selectedMaterial ? (
          <>
            <Text style={[styles.body, { color: theme.semantic.textPrimary }]}>
              {selectedMaterial.aiPlainExplanation}
            </Text>
            <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>
              Если коротко: возьми одну идею из материала и используй ее как новую формулировку в следующем разговоре.
            </Text>
          </>
        ) : null}

        {sheetState?.kind === "example" && selectedMaterial ? (
          <>
            <Text style={[styles.body, { color: theme.semantic.textPrimary }]}>
              {selectedMaterial.clientAnswerExample}
            </Text>
            <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>
              Старайся не копировать фразу дословно, а сохранить логику: уточнение → связка с ценностью → следующий шаг.
            </Text>
          </>
        ) : null}

        {sheetState?.kind === "plan" && selectedMaterial ? (
          <>
            <Text style={[styles.body, { color: theme.semantic.textPrimary }]}>
              Материал уже отмечен для следующей практики.
            </Text>
            <Text style={[styles.listItem, { color: theme.semantic.textPrimary }]}>
              • {selectedMaterial.title}
            </Text>
            <Text style={[styles.listItem, { color: theme.semantic.textPrimary }]}>
              • Фокус в диалоге: {selectedMaterial.applyInDialogue}
            </Text>
          </>
        ) : null}
      </AppBottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  cardTitle: {
    fontSize: 18,
    fontWeight: "800"
  },
  subTitle: {
    fontSize: 16,
    fontWeight: "800"
  },
  body: {
    fontSize: 15,
    lineHeight: 22
  },
  filterRow: {
    gap: 8,
    paddingRight: 12
  },
  materialGrid: {
    gap: 12
  },
  materialGridWrap: {
    flexDirection: "row",
    flexWrap: "wrap"
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 16,
    minHeight: 48,
    paddingHorizontal: 14,
    fontSize: 15
  },
  successText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700"
  },
  listItem: {
    fontSize: 14,
    lineHeight: 20
  }
});
