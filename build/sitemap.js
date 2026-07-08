window.onload = function() {

    // DEV : Debug ON
    console.log(&#39;DC SDK loadeded &gt;&gt;: &#39; + SalesforceInteractions);
    SalesforceInteractions.setLoggingLevel(&#39;debug&#39;);

    SalesforceInteractions.Personalization.Config.initialize({
        additionalTransformers: [
            {
                  name: &#39;Products Rec Template&#39;,
                  transformerType: &#39;Handlebars&#39;,
                  lastModifiedDate: new Date().getTime(),
                  substitutionDefinitions: {
                      blocktitle: { defaultValue: &#39;[attributes].[Block_Title]&#39;},
                      recs: { defaultValue: &#39;[data]&#39; },
                      name: { defaultValue: &#39;[ssot__Name__c]&#39; },
                      description: { defaultValue: &#39;[ssot__Description__c]&#39; },
                      image: { defaultValue: &#39;[Image_URL__c]&#39; }
                  },
                  transformerTypeDetails: {
                      html: 
                            `&lt;section class=&quot;related-products&quot;&gt;
                                {{#if (subVar &#39;recs&#39;)}}
                                    &lt;h2&gt;{{subVar &#39;blocktitle&#39;}}&lt;/h2&gt;
                                    &lt;div class=&quot;product-list&quot;&gt;
                                        {{#each (subVar &#39;recs&#39;)}}
                                        &lt;div class=&quot;product&quot;&gt;
                                            &lt;img src=&quot;{{subVar &#39;image&#39; }}&quot; alt=&quot;{{subVar &#39;name&#39;}}&quot; &gt;
                                            &lt;h3&gt;{{subVar &#39;name&#39;}}&lt;/h3&gt;
                                            &lt;p&gt;{{subVar &#39;description&#39;}}&lt;/p&gt;
                                        &lt;/div&gt;
                                        {{/each}}
                                    &lt;/div&gt;
                                {{else}}
                                    &lt;h2&gt;You Might Also Like&lt;/h2&gt;
                                    &lt;div class=&quot;product-list&quot;&gt;
                                        &lt;div class=&quot;product&quot;&gt;
                                            &lt;img src=&quot;https://image.s4.sfmc-content.com/lib/fe3411727664067c751c76/m/1/6b430063-7d8a-496e-89b5-d574d34e29c2.png&quot; alt=&quot;ePhone 14 Mini&quot;&gt;
                                            &lt;h3&gt;ePhone 14 Mini&lt;/h3&gt;
                                            &lt;p&gt;The miniature form ePhone&lt;/p&gt;
                                        &lt;/div&gt;
                                        &lt;div class=&quot;product&quot;&gt;
                                            &lt;img src=&quot;https://image.s4.sfmc-content.com/lib/fe3411727664067c751c76/m/1/969c9b49-1d29-4e61-86c1-fd597b62fefb.png&quot; alt=&quot;ePhone 14 Pro&quot;&gt;
                                            &lt;h3&gt;ePhone 14 Pro&lt;/h3&gt;
                                            &lt;p&gt;The most powerful phone yet&lt;/p&gt;
                                        &lt;/div&gt;
                                        &lt;div class=&quot;product&quot;&gt;
                                            &lt;img src=&quot;https://s3.amazonaws.com/northerntrailoutfitters.com/quadstar/default/images/large/ePad5-Mini-blackf.jpg&quot; alt=&quot;ePad 5 Mini&quot;&gt;
                                            &lt;h3&gt;ePad 5 Mini&lt;/h3&gt;
                                            &lt;p&gt;The best tiny tablet&lt;/p&gt;
                                        &lt;/div&gt;
                                    &lt;/div&gt;
                                {{/if}}
                            &lt;/section&gt;`
                        
                }
            }
        ],
        personalizationExperienceConfigs: [
          {
            &quot;name&quot;: &quot;Home_Banner_Personnalization&quot;,
            &quot;dataProvider&quot;: {
              &quot;type&quot;: &quot;PersonalizationPoint&quot;,
              &quot;referenceType&quot;: &quot;ApiName&quot;,
              &quot;value&quot;: &quot;Home_Banner_Personnalization&quot;
            },
            &quot;sourceMatchers&quot;: [
              {
                &quot;type&quot;: &quot;PageType&quot;,
                &quot;value&quot;: &quot;page&quot;
              }
            ],
            &quot;transformationConfig&quot;: {
              &quot;when&quot;: &quot;Immediately&quot;,
              &quot;method&quot;: &quot;ReplaceElementContent&quot;,
              &quot;transformations&quot;: [
                {
                  &quot;transformerName&quot;: &quot;HTMLElementModifier&quot;,
                  &quot;path&quot;: &quot;html &gt; body &gt; div:nth-of-type(2)&quot;,
                  &quot;tag&quot;: &quot;DIV&quot;,
                  &quot;substitutionValues&quot;: {
                    &quot;style.backgroundImage&quot;: &quot;[attributes].[BackgroundImageUrl]&quot;
                  }
                },
                {
                  &quot;transformerName&quot;: &quot;HTMLElementModifier&quot;,
                  &quot;tag&quot;: &quot;H1&quot;,
                  &quot;path&quot;: &quot;DIV.hero-text&gt;h1&quot;,
                  &quot;substitutionValues&quot;: {
                    &quot;innerText&quot;: &quot;[attributes].[Header]&quot;
                  }
                },
                {
                  &quot;transformerName&quot;: &quot;HTMLElementModifier&quot;,
                  &quot;tag&quot;: &quot;P&quot;,
                  &quot;path&quot;: &quot;html &gt; body &gt; div:nth-of-type(2) &gt; div &gt; p&quot;,
                  &quot;substitutionValues&quot;: {
                    &quot;innerText&quot;: &quot;[attributes].[Subheader]&quot;
                  }
                }
              ]
            },
            &quot;lastModifiedDate&quot;: 1739545922100
          },
          {
            &quot;name&quot;: &quot;Single_Product_Recommendation&quot;,
            &quot;dataProvider&quot;: {
              &quot;type&quot;: &quot;PersonalizationPoint&quot;,
              &quot;referenceType&quot;: &quot;ApiName&quot;,
              &quot;value&quot;: &quot;Single_Product_Recommendation&quot;
            },
            &quot;sourceMatchers&quot;: [
              {
                &quot;type&quot;: &quot;PageType&quot;,
                &quot;value&quot;: &quot;Product&quot;
              }
            ],
            &quot;transformationConfig&quot;: {
              &quot;when&quot;: &quot;Immediately&quot;,
              &quot;method&quot;: &quot;ReplaceElementContent&quot;,
              &quot;transformations&quot;: [
                {
                  &quot;transformerName&quot;: &quot;HTMLElementModifier&quot;,
                  &quot;path&quot;: &quot;html &gt; body &gt; section &gt; div &gt; div &gt; h3&quot;,
                  &quot;tag&quot;: &quot;H3&quot;,
                  &quot;substitutionValues&quot;: {
                    &quot;innerText&quot;: &quot;[data].[0].[ssot__Name__c]&quot;
                  }
                },
                {
                  &quot;transformerName&quot;: &quot;HTMLElementModifier&quot;,
                  &quot;tag&quot;: &quot;P&quot;,
                  &quot;path&quot;: &quot;html &gt; body &gt; section &gt; div &gt; div &gt; p&quot;,
                  &quot;substitutionValues&quot;: {
                    &quot;innerText&quot;: &quot;[data].[0].[ssot__Description__c]&quot;
                  }
                },
                {
                  &quot;transformerName&quot;: &quot;HTMLElementModifier&quot;,
                  &quot;tag&quot;: &quot;IMG&quot;,
                  &quot;path&quot;: &quot;html &gt; body &gt; section &gt; div &gt; div &gt; img&quot;,
                  &quot;substitutionValues&quot;: {
                    &quot;attributes.src&quot;: &quot;[data].[0].[Image_URL__c]&quot;
                  }
                }
              ]
            },
            &quot;lastModifiedDate&quot;: 1739882556670
          }
        ]
    });

    // Init SDK: initialize with default optin
    // /!&#92; not production ready: update to declarative consent
    SalesforceInteractions.init({
        consents: [
            {
                provider: &quot;ConsentProvider&quot;,
                purpose: SalesforceInteractions.ConsentPurpose.Tracking,
                status: SalesforceInteractions.ConsentStatus.OptIn
            }
        ],
        personalization: {
            dataspace: &quot;default&quot;,
        }
    }).then(() =&gt; {
        console.log(&#39;Interactions WebSDK initialized&gt;&gt;&gt;&#39;);
    }).then(() =&gt; {
        var config = {
            global: {
              locale: document.querySelector(&#39;meta[name=&quot;locale&quot;]&#39;).content,
              onActionEvent: (actionEvent) =&gt; {
              // Ensure objects exist
              actionEvent.user = actionEvent.user || {};
              actionEvent.user.attributes = actionEvent.user.attributes || {};
              actionEvent.user.attributes.eventType = actionEvent.user.attributes.eventType || &quot;identity&quot;;
              const meta = document.querySelector(&#39;meta[name=&quot;locale&quot;]&#39;);
              actionEvent.user.attributes.sourceLocale = meta ? meta.content : null;

              return actionEvent;
            },
                contentZones: [&quot;div#hero-image&quot;]
            },
            pageTypes: [
                {
                    // Track product pages only: &#39;isMatch&#39; regex filters
                    name: &quot;product&quot;,
                    isMatch: () =&gt; /&#92;/tuxn3zbr2r4/.test(window.location.href),
                    interaction: {
                        name: &quot;ViewCatalogObject&quot;,
                        catalogObject: {
                            type: &quot;Product&quot;,
                            id: &#39;product_1&#39;,
                            interactionName: &quot;View&quot;,
                            attributes: {
                                description: getProductDescription(),
                                name: getProductTitle(),
                                sourcePageSubtype: &#39;Auto&#39;
                            }
                        }
                    }
                },
                {
                    // Track product pages only: &#39;isMatch&#39; regex filters
                    name: &quot;product&quot;,
                    isMatch: () =&gt; /&#92;/kphq50fzfi4/.test(window.location.href),
                    interaction: {
                        name: &quot;ViewCatalogObject&quot;,
                        catalogObject: {
                            type: &quot;Product&quot;,
                            id: &#39;product_2&#39;,
                            interactionName: &quot;View&quot;,
                            attributes: {
                                description: getProductDescription(),
                                name: getProductTitle(),
                                sourcePageSubtype: &#39;Home&#39;
                              
                            }
                        }
                    }
                },
                {
                    // Track product pages only: &#39;isMatch&#39; regex filters
                    name: &quot;product&quot;,
                    isMatch: () =&gt; /&#92;/ozwtqwtouvl/.test(window.location.href),
                    interaction: {
                        name: &quot;ViewCatalogObject&quot;,
                        catalogObject: {
                            type: &quot;Product&quot;,
                            id: &#39;product_3&#39;,
                            interactionName: &quot;View&quot;,
                            attributes: {
                                description: getProductDescription(),
                                name: getProductTitle(),
                                sourcePageSubtype: &#39;Alumni&#39;
                            }
                        }
                    }
                },
                //track homepage views
                {
                    name: &quot;homepage&quot;,
                    isMatch: () =&gt; /^&#92;/$/.test(window.location.pathname) || window.location.pathname === &quot;/b0xqymni1uo&quot;, 
                    interaction: {
                        name: &quot;Homepage View&quot;,
                        eventType: &quot;PageView&quot;, 
                    }
                },
                {
                    // Track every page of the website
                    name: &quot;page&quot;,
                    isMatch: () =&gt; true,
                    interaction: {
                        name: getPageName(),
                        eventType: &quot;PageView&quot;,
                        browse: {
                            pageName: getPageName(),
                            pageType: &quot;page&quot;,
                            pageUrl: window.location.href
                        },
                        catalogObject: {
                            type: &quot;PageView&quot;,
                            id: window.location.pathname,
                            attributes: {
                                url: window.location.href,
                                path: window.location.pathname,
                                title: document.title,
                                category: getPageCategory(),
                                referrer: document.referrer,
                                timestamp: new Date().toISOString()
                            }
                        }
                    }
                }
            ]
        };
        SalesforceInteractions.initSitemap(config);
    });
const productPageMap = {
    &quot;/tuxn3zbr2r4&quot;: &quot;Auto&quot;,
    &quot;/kphq50fzfi4&quot;: &quot;Home&quot;,
    &quot;/ozwtqwtouvl&quot;: &quot;Alumni&quot;
};

const currentPath = window.location.pathname;
  if (productPageMap[currentPath] &amp;&amp; !window.productEventSent) {
    window.productEventSent = true;

    SalesforceInteractions.sendEvent({
        interaction: {
            name: &quot;Sub Page Type&quot;,
            eventType: &quot;userEngagement&quot;,
            category: &quot;Engagement&quot;,
            sourcePageSubtype: productPageMap[currentPath]
        }
    });
}
};
//   ----------------------------------------------------------------
 window.submitAuthForm = function() {
        const inputs = document.getElementById(&quot;authenticationForm&quot;).elements;

        SalesforceInteractions.sendEvent({
            user: {
                attributes: {
                    eventType: &#39;identity&#39;,
                    firstName: inputs[&quot;firstname&quot;].value,
                    lastName: inputs[&quot;lastname&quot;].value,
                    email: inputs[&quot;email&quot;].value,
                  phoneNumber: inputs[&quot;phone&quot;].value,
birthdate: inputs[&quot;birthdate&quot;].value,
                    sourcePageType: window.location.href,
                    isAnonymous: 0
                }
            }
        });
    /* Contact Point Email Event */
    SalesforceInteractions.sendEvent({
        user: {
            attributes: {
                eemail: inputs[&quot;email&quot;].value,
                eventType: &quot;contactPointEmail&quot;,
            }
        }
    });
   /* Contact Point Email Event */
    SalesforceInteractions.sendEvent({
        user: {
            attributes: {
                phoneNumber: inputs[&quot;phone&quot;].value,
                eventType: &quot;contactPointPhone&quot;,
            }
        }
    });
    /* Party Id Event */
    SalesforceInteractions.sendEvent({
        user: {
            attributes: {
                eventType: &#39;partyIdentification&#39;,
                IDName: &quot;Web&quot;,
                IDType: &quot;WebTracking&quot;
            }
        }
    });
     // Optional: hide form after submit
    window.hideAuthForm();
}
function addToCart(productId) {
    SalesforceInteractions.sendEvent({
        interaction: {
            name: &quot;Add To Cart&quot;,
            lineItem: {
                catalogObjectType: &quot;Product&quot;,
                catalogObjectId: getProductId(),
                quantity: 1,
                price: 148.00,
                currency: &quot;USD&quot;
            }
        }
    });
}
// ----------------------------------------------------------------
// SignUp Popup Campaign Functions
// ----------------------------------------------------------------
window.submitSimplePopup = function() {
    // 1. Get Email
    var emailInput = document.getElementById(&quot;dc-email&quot;);
    if (!emailInput) return;
    
    var email = emailInput.value;

    // 2. Validation
    if (!email || email.indexOf(&#39;@&#39;) === -1) {
        document.getElementById(&quot;dc-error&quot;).style.display = &#39;block&#39;;
        return;
    }
    document.getElementById(&quot;dc-error&quot;).style.display = &#39;none&#39;;

    // 3. Send Event to Data Cloud
    SalesforceInteractions.sendEvent({
        interaction: {
                        name: &#39;Popup Signup Form Submitted&#39;,
                        eventType: &#39;userEngagement&#39;,
                        category: &quot;Engagement&quot;
                    },
        user: {
            attributes: {
                eventType: &#39;identity&#39;,
                email: email,
                isAnonymous: 0,
                sourcePageType: window.location.href
            }
        }
    });
      /* Party Id event */
    SalesforceInteractions.sendEvent({
        user: {
            attributes: {
                eventType: &#39;partyIdentification&#39;,
                IDName: &quot;Signup Popup&quot;,
                IDType: &quot;PopupSignup Submission&quot;
            }
        }
    });
    /* Contact Point Email event */
    SalesforceInteractions.sendEvent({
        user: {
            attributes: {
                eemail: email,
                eventType: &quot;contactPointEmail&quot;,
            }
        }
    });

    // 4. UI Success
    document.getElementById(&quot;dc-form-state&quot;).style.display = &#39;none&#39;;
    document.getElementById(&quot;dc-success-state&quot;).style.display = &#39;block&#39;;

};
// ----------------------------
// utility functions for each Campaign
// ----------------------------

  window.addEventListener(&quot;DOMContentLoaded&quot;, () =&gt; {
    // ─── SHARED POPUP CONFIG ───────────────────────────────────────────────────
    // immediate = WPM shows it (desktop exit-intent) → JS only fires events.
    // gated     = mobile/tablet + inactivity, JS reveals it.
    var SP_POPUPS = [
      { id: &#39;sp-campaign&#39;,        mode: &#39;immediate&#39; },   // desktop — WPM handles exit-intent
      { id: &#39;sp-campaign-mobile&#39;, mode: &#39;gated&#39;     }    // mobile  — JS handles inactivity
    ];
    var SP_POPUP_IDS = SP_POPUPS.map(function (p) { return p.id; });

    var INACTIVITY_MS = 5000;     // idle time for mobile (set 30000 for prod)

    // Dedup guards — each campaign fires each event at most once
    var viewedSent = {}, clickedSent = {}, dismissedSent = {};

    function isMobileOrTablet() {
      return /Mobi|Android|iPad|iPhone|iPod|Tablet/i.test(navigator.userAgent) ||
             window.matchMedia(&quot;(max-width: 1024px)&quot;).matches;
    }

    function sendViewed(name) {
      if (!name || viewedSent[name] || !window.SalesforceInteractions) return;
      viewedSent[name] = true;
      SalesforceInteractions.sendEvent({
        interaction: { name: &quot;Viewed - &quot; + name, eventType: &#39;userEngagement&#39;, category: &quot;Engagement&quot; }
      });
    }
    function sendClicked(name) {
      if (!name || clickedSent[name] || !window.SalesforceInteractions) return;
      clickedSent[name] = true;
      SalesforceInteractions.sendEvent({
        interaction: { name: &quot;Clicked On Popup Campaign - &quot; + name, eventType: &#39;userEngagement&#39;, category: &quot;Engagement&quot; }
      });
    }
    function sendDismissed(name) {
      if (!name || dismissedSent[name] || !window.SalesforceInteractions) return;
      dismissedSent[name] = true;
      SalesforceInteractions.sendEvent({
        interaction: { name: &quot;Dismissed - &quot; + name, eventType: &#39;userEngagement&#39;, category: &quot;Engagement&quot; }
      });
    }

    // Mobile gated: mobile/tablet only + inactivity, then reveal + fire Viewed
    function initGatedPopup(overlay) {
      if (!isMobileOrTablet()) { overlay.remove(); return; }   // desktop → remove, no event
      var timer;
      var events = [&quot;mousemove&quot;, &quot;keydown&quot;, &quot;scroll&quot;, &quot;touchstart&quot;, &quot;click&quot;];
      function show() {
        clearTimeout(timer);
        events.forEach(function (e) { window.removeEventListener(e, reset); });
        document.body.appendChild(overlay);
        overlay.style.display = &quot;flex&quot;;
        requestAnimationFrame(function () { overlay.style.opacity = &quot;1&quot;; });
        sendViewed(overlay.getAttribute(&#39;data-name&#39;) || overlay.id);
      }
      function reset() { clearTimeout(timer); timer = setTimeout(show, INACTIVITY_MS); }
      events.forEach(function (e) { window.addEventListener(e, reset, { passive: true }); });
      reset();
    }

    function handlePopup(overlay, cfg) {
      if (cfg.mode === &#39;gated&#39;) {
        initGatedPopup(overlay);
      } else {
        // immediate: WPM already shows it (exit-intent) → just fire Viewed once
        sendViewed(overlay.getAttribute(&#39;data-name&#39;) || overlay.id);
      }
    }

    // ─── OBSERVER: watches for either popup being injected (each handled once) ──
    // No timeout/early-disconnect: exit-intent can inject anytime the user leaves.
    // The `handled` + `viewedSent` guards keep every event firing exactly once.
    var handled = {};
    var observer = new MutationObserver(function (mutations) {
      for (var m = 0; m &lt; mutations.length; m++) {
        var nodes = mutations[m].addedNodes;
        for (var n = 0; n &lt; nodes.length; n++) {
          var node = nodes[n];
          if (node.nodeType !== 1) continue;
          for (var p = 0; p &lt; SP_POPUPS.length; p++) {
            var cfg = SP_POPUPS[p];
            if (handled[cfg.id]) continue;
            var overlay = node.id === cfg.id
                ? node
                : (node.querySelector ? node.querySelector(&#39;#&#39; + cfg.id) : null);
            if (overlay) { handled[cfg.id] = true; handlePopup(overlay, cfg); }
          }
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // ─── CLICK: first meaningful click per popup (ignores close button) ─────────
    document.addEventListener(&quot;click&quot;, function (event) {
      if (event.target.closest(&#39;#dc-close-btn&#39;)) return;   // close = dismiss, not click
      for (var i = 0; i &lt; SP_POPUP_IDS.length; i++) {
        var overlay = event.target.closest(&#39;#&#39; + SP_POPUP_IDS[i]);
        if (overlay) { sendClicked(overlay.getAttribute(&#39;data-name&#39;) || overlay.id); return; }
      }
    });

    // ─── DISMISS: hide popup + fire Dismissed once ──────────────────────────────
    window.spDismissPopup = function (personalizationPointName) {
      SP_POPUP_IDS.forEach(function (id) {
        var overlay = document.getElementById(id);
        if (overlay) overlay.style.display = &#39;none&#39;;
      });
      sendDismissed(personalizationPointName);
    };
  });


// ----------------------------
// Helpers &amp; utility functions
// ----------------------------

// Get descriptive page name
function getPageName() {
    const path = window.location.pathname;
    const segments = path.split(&#39;/&#39;).filter(Boolean);

    // Si pas de segment, c&#39;est la home
    if (segments.length === 0) return &quot;Homepage&quot;;

    // On nettoie et transforme chaque segment
    const cleanedSegments = segments.map(segment =&gt; {
        // Enlève l&#39;extension .html si présente
        const withoutExt = segment.replace(&#39;.html&#39;, &#39;&#39;);
        // Convertit en camelCase et enlève les caractères non-alphanumériques
        return withoutExt
            .split(/[^a-zA-Z0-9]+/)
            .map((word, index) =&gt; {
                if (index === 0) {
                    // Premier mot commence par une majuscule
                    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
                }
                // Mots suivants en camelCase
                return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
            })
            .join(&#39;&#39;);
    });

    // Join avec des underscores et limite à 80 caractères
    return cleanedSegments.join(&#39;_&#39;).slice(0, 80);
}

// Get page category
function getPageCategory() {
    const segments = window.location.pathname.split(&#39;/&#39;).filter(Boolean);
    return segments[0] || &#39;home&#39;;
}

function getProductId() {
    const segments = window.location.pathname.split(&#39;/&#39;).filter(Boolean);
    const product = segments[segments.length - 1].replace(&#39;.html&#39;, &#39;&#39;);
    return product || &#39;product1&#39;;
}

function getProductTitle() {
    try {
        return document.getElementsByClassName(&quot;product-description&quot;)[0].getElementsByTagName(&quot;h1&quot;)[0].innerText;
    }
    catch {
        return &quot;&quot;;
    }
}

function getProductDescription() {
    try {
        return document.getElementsByClassName(&quot;product-description&quot;)[0].getElementsByTagName(&quot;p&quot;)[0].innerText;
    }
    catch {
        return &quot;&quot;;
    }
}

// Display/Hide login form on header button click
 window.displayAuthForm = function() {
        document.getElementById(&quot;loginform&quot;).style.visibility = &quot;visible&quot;;
    }

    window.hideAuthForm = function() {
        document.getElementById(&quot;loginform&quot;).style.visibility = &quot;hidden&quot;;
    }