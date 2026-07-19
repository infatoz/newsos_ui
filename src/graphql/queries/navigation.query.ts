import { gql } from "@apollo/client";

const MENU_ITEM_FIELDS = `
  id
  databaseId
  label
  url
  path
  target
  description
  order
  cssClasses
  children {
    id
    databaseId
    label
    url
    path
    target
    description
    order
    cssClasses
    children {
      id
      databaseId
      label
      url
      path
      target
      order
    }
  }
`;

/**
 * Portal chrome: ENM siteMenus (locations) + mobile bottom tabs.
 */
export const GET_NAVIGATION = gql`
  query GetNavigation {
    siteMenus {
      desktop {
        ${MENU_ITEM_FIELDS}
      }
      top {
        ${MENU_ITEM_FIELDS}
      }
      company {
        ${MENU_ITEM_FIELDS}
      }
      explore {
        ${MENU_ITEM_FIELDS}
      }
      policies {
        ${MENU_ITEM_FIELDS}
      }
      trending {
        ${MENU_ITEM_FIELDS}
      }
      mobileScroll {
        ${MENU_ITEM_FIELDS}
      }
      amp {
        ${MENU_ITEM_FIELDS}
      }
    }
    footerSettings {
      showBrand
      showAbout
      showSocial
      showContact
      showCopyright
      showNewsletter
      aboutText
      copyrightText
      contactEmail
      contactPhone
      facebookUrl
      xUrl
      instagramUrl
      youtubeUrl
      linkedinUrl
      companyTitle
      exploreTitle
      policiesTitle
      newsletterTitle
      newsletterText
      newsletterPlaceholder
      newsletterButton
      newsletterAction
    }
    mobileNav {
      enabled
      backgroundColor
      textColor
      hoverColor
      activeColor
      borderColor
      showOnHome
      showOnArticle
      showOnCategory
      showOnSearch
      hideOnScroll
      tabs {
        icon
        iconSvg
        label
        url
        order
        visible
      }
    }
  }
`;

export const GET_MOBILE_NAV = gql`
  query GetMobileNav {
    mobileNav {
      enabled
      backgroundColor
      textColor
      hoverColor
      activeColor
      borderColor
      showOnHome
      showOnArticle
      showOnCategory
      showOnSearch
      hideOnScroll
      tabs {
        icon
        iconSvg
        label
        url
        order
        visible
      }
    }
  }
`;
