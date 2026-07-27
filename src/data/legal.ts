const legalVersion = "20260727";

export const legalContent = {
  company: {
    legalName: "Общество с ограниченной ответственностью «Цифровая методология»",
    shortName: "Цифровая методология",
    inn: "5010060840",
    kpp: "501001001",
    ogrn: "1235000008275"
  },
  pages: {
    privacyPolicy: `/legal/privacy-policy.html?v=${legalVersion}`,
    personalDataPolicy: `/legal/personal-data-policy.html?v=${legalVersion}`,
    cookiesConsent: `/legal/cookies-consent.html?v=${legalVersion}`,
    personalDataConsent: `/legal/personal-data-consent.html?v=${legalVersion}`
  },
  documents: {
    privacyPolicy: {
      label: "Политика конфиденциальности",
      href: `/legal/privacy-policy.docx?v=${legalVersion}`
    },
    personalDataPolicy: {
      label: "Политика обработки персональных данных",
      href: `/legal/personal-data-policy.docx?v=${legalVersion}`
    },
    personalDataConsent: {
      label: "Согласие на обработку персональных данных",
      href: `/legal/personal-data-consent.docx?v=${legalVersion}`
    },
    cookiesConsent: {
      label: "Согласие на обработку данных Cookies",
      href: `/legal/cookies-consent.docx?v=${legalVersion}`
    }
  }
} as const;

export type LegalDocumentLink = (typeof legalContent.documents)[keyof typeof legalContent.documents];
