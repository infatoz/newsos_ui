import { gql } from "@apollo/client";

export const GET_SITE_SETTINGS = gql`
  query GetSiteSettings {
    siteSettings {
      siteName
      siteTagline
      logoUrl
      faviconUrl
      defaultOgImage
      imagePlaceholder
      timezoneDisplay
      relatedPostsCount
      relatedPostsMode
      enableBreakingTicker
      enableLiveBlog
      enableWebStories
      enablePolls
      push {
        enabled
        provider
        onesignalAppId
        onesignalSafariWebId
        firebaseApiKey
        firebaseProjectId
        firebaseSenderId
        firebaseAppId
        firebaseVapidKey
        defaultIconUrl
        promptOnHomepage
        promptDelaySeconds
        categoriesEnabled
      }
    }

    scripts {
      enabled
      environment
      enabledForEnvironment
      headerScripts
      bodyOpenScripts
      footerScripts
      ga4MeasurementId
      gtmContainerId
      facebookPixelId
      twitterPixelId
      linkedinPartnerId
      googleSiteVerification
      bingSiteVerification
      pinterestVerification
      customVerification
      ampAnalyticsJson
    }

    generalSettings {
      title
      description
      url
      language
      timezone
      dateFormat
      timeFormat
    }

    seoSettings {
      adsTxt
      appAdsTxt
      robotsTxt
      assetlinksJson
      appleAppSiteAssociation
      enableAmp
      ampArticleEnabled
      ampStoriesEnabled
      newsPublicationName
      newsPublicationLanguage
      googleNewsLabels
      sitemapNewsHours
      enableNewsSitemap
      enableImageSitemap
      enableVideoSitemap
      enableStoriesSitemap
      enableDiscoverSitemap
      enableDailyNewsSitemap
      llmsTxt
      shareWhatsapp
      shareX
      shareFacebook
      shareCopy
      googlePreferredSourceEnabled
      googlePreferredSourceDomain
      googlePreferredSourceLabel
      googlePreferredSourceOnArticles
      googlePreferredSourceUrl
      articleFontEnabled
      articleFontDefaultPx
      articleFontMinPx
      articleFontMaxPx
      articleFontStepPx
      articleFontLineHeight
      articleFontScaleLineHeight
      articleFontShowReset
      articleFontShowSizeLabel
      articleFontStorageKey
      articleFontDecreaseLabel
      articleFontIncreaseLabel
      articleFontResetLabel
      articleFontToolbarLabel
      selectionToolbarEnabled
      selectionSearchEnabled
      selectionShareEnabled
      selectionCopyEnabled
      selectionSearchEngine
      selectionMinChars
      selectionSearchLabel
      selectionShareLabel
      selectionCopyLabel
    }
  }
`;

export const GET_SEO_SETTINGS = gql`
  query GetSeoSettings {
    seoSettings {
      adsTxt
      appAdsTxt
      robotsTxt
      assetlinksJson
      appleAppSiteAssociation
      enableAmp
      ampArticleEnabled
      ampStoriesEnabled
      newsPublicationName
      newsPublicationLanguage
      googleNewsLabels
      sitemapNewsHours
      enableNewsSitemap
      enableImageSitemap
      enableVideoSitemap
      enableStoriesSitemap
      enableDiscoverSitemap
      enableDailyNewsSitemap
      llmsTxt
      shareWhatsapp
      shareX
      shareFacebook
      shareCopy
      googlePreferredSourceEnabled
      googlePreferredSourceDomain
      googlePreferredSourceLabel
      googlePreferredSourceOnArticles
      googlePreferredSourceUrl
      articleFontEnabled
      articleFontDefaultPx
      articleFontMinPx
      articleFontMaxPx
      articleFontStepPx
      articleFontLineHeight
      articleFontScaleLineHeight
      articleFontShowReset
      articleFontShowSizeLabel
      articleFontStorageKey
      articleFontDecreaseLabel
      articleFontIncreaseLabel
      articleFontResetLabel
      articleFontToolbarLabel
      selectionToolbarEnabled
      selectionSearchEnabled
      selectionShareEnabled
      selectionCopyEnabled
      selectionSearchEngine
      selectionMinChars
      selectionSearchLabel
      selectionShareLabel
      selectionCopyLabel
    }
  }
`;

export const GET_SCRIPTS = gql`
  query GetScripts {
    scripts {
      enabled
      environment
      enabledForEnvironment
      headerScripts
      bodyOpenScripts
      footerScripts
      ga4MeasurementId
      gtmContainerId
      facebookPixelId
      twitterPixelId
      linkedinPartnerId
      googleSiteVerification
      bingSiteVerification
      pinterestVerification
      customVerification
      ampAnalyticsJson
    }
  }
`;
