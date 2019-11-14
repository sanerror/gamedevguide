const postcssCustomMedia = require(`postcss-custom-media`);
const autoprefixer = require(`autoprefixer`);
const cssVariables = require(`postcss-css-variables`);
const colorModFunction = require(`postcss-color-mod-function`);
const cssNano = require(`cssnano`);
const customProperties = require(`postcss-custom-properties`);
const easyImport = require(`postcss-easy-import`);
const algoliaQueries = require(`./utils/algolia-queries`);
const path = require(`path`);
const siteCfg = require("./SiteCfg");
const _ = require('lodash');

const pathPrefix = siteCfg.pathPrefix === "/" ? "" : siteCfg.pathPrefix;

require(`dotenv`).config({
    path: `.env.${process.env.NODE_ENV}`
});



const SERVICE_WORKER_KILL_SWITCH =
    process.env.SERVICE_WORKER_KILL_SWITCH === `true` || false;

const plugins = [
    /**
     *  Content Plugins
     */
    {
        resolve: `gatsby-source-filesystem`,
        options: {
            path: path.join(__dirname, `content`),
            name: `markdown-pages`
        }
    },
    {
        resolve: `gatsby-source-filesystem`,
        options: {
            path: path.join(__dirname, `src`, `images`),
            name: `images`
        }
    },
    {
        resolve: "gatsby-transformer-json",
        options: {
            typeName: ({ node }) =>
                _.last(path.parse(node.absolutePath).dir.split("/"))
        }
    },
    {
        resolve: "gatsby-source-filesystem",
        options: {
            name: "menuItems",
            path: `${__dirname}/SiteCfg/json/MenuItems`
        }
    },
    `gatsby-plugin-sharp`,
    `gatsby-transformer-sharp`,
    {
        resolve: `gatsby-transformer-remark`,
        options: {
            plugins: [
                {
                    resolve: `gatsby-remark-images`,
                    options: {
                        withWebp: true
                    }
                },
                {
                    resolve: `gatsby-remark-snippets`,
                    options: {
                        // Example code links are relative to this dir.
                        // eg examples/path/to/file.js
                        directory: `${__dirname}/content/.examples/`
                    }
                },
                {
                    resolve: `gatsby-remark-embed-snippet`,
                    options: {
                        // Example code links are relative to this dir.
                        // eg examples/path/to/file.js
                        directory: `${__dirname}/content/.examples/`
                    }
                },
                `gatsby-remark-autolink-headers`,
                `gatsby-remark-code-titles`,
                `gatsby-remark-prismjs`,
                `gatsby-remark-external-links`
            ]
        }
    },
    `gatsby-transformer-yaml`,
    `gatsby-plugin-catch-links`,
    /**
     *  Utility Plugins
     */
    {
        resolve: `gatsby-plugin-manifest`,
        options: {
            name: `Ghost Docs`,
            short_name: `Ghost`,
            start_url: `/`,
            background_color: `#343f44`,
            theme_color: `#343f44`,
            display: `minimal-ui`,
            icon: `static/favicon.png`
        }
    },
    `gatsby-plugin-react-helmet`,
    {
        resolve: `gatsby-plugin-advanced-sitemap`,
        options: {
            query: `
                {
                allMarkdownRemark{
                    edges {
                        node {
                            id
                            frontmatter {
                                published_at: date
                                feature_image: image
                            }
                            fields {
                                slug
                            }
                        }
                    }
                }
            }`,
            mapping: {
                allMarkdownRemark: {
                    sitemap: `pages`
                }
            },
            exclude: [
                `/dev-404-page`,
                `/404`,
                `/404.html`,
                `/offline-plugin-app-shell-fallback`,
                `/data-schema`,
                `/data-schema-2`,
                `/v0.11/README`,
                `/README`,
                /(\/)?hash-\S*/ // exclude internal tags
            ]
        }
    },
    `gatsby-plugin-force-trailing-slashes`,
    /**
     *  Display Plugins
     */
    {
        resolve: `gatsby-plugin-postcss`,
        options: {
            postCssPlugins: [
                autoprefixer(),
                easyImport(),
                cssVariables(),
                colorModFunction(),
                customProperties({ preserve: false }),
                postcssCustomMedia(),
                cssNano({ zindex: false })
            ]
        }
    },
    {
        resolve: `gatsby-plugin-react-svg`,
        options: {
            rule: {
                include: /icons/
            }
        }
    },
    {
        resolve: "gatsby-transformer-json",
        options: {
            typeName: ({ node }) =>
                _.last(path.parse(node.absolutePath).dir.split("/"))
        }
    },

];

const runAlgoliaBuild = () =>
    (process.env.INCOMING_HOOK_TITLE &&
        process.env.INCOMING_HOOK_TITLE === `Algolia`) ||
    process.env.ALGOLIA;
const hasAlgoliaKey = () =>
    process.env.ALGOLIA_ADMIN_KEY &&
    !process.env.ALGOLIA_ADMIN_KEY.match(/<key>/);

if ( hasAlgoliaKey()) {
    plugins.push({
        resolve: `gatsby-plugin-algolia`,
        options: {
            appId: `FULTPXSSOM`,
            apiKey: `${process.env.ALGOLIA_ADMIN_KEY}`,
            queries: algoliaQueries,
            chunkSize: 10000 // default: 1000
        }
    });
}

// Global switch to either use or remove service worker
if (SERVICE_WORKER_KILL_SWITCH) {
    console.log(`Remove service worker plugin`);
    plugins.push(`gatsby-plugin-remove-serviceworker`);
} else {
    console.log(`Install service worker plugin`);
    plugins.push(`gatsby-plugin-offline`);
}

module.exports = {
    pathPrefix: siteCfg.pathPrefix,

    siteMetadata: {
        title: siteCfg.siteNavTitle,
        siteUrl: siteCfg.siteUrl + pathPrefix,
        description: siteCfg.siteDescription
    },
    plugins: plugins
};
