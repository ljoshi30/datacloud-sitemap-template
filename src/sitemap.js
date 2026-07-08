window.onload = function() {

    // DEV : Debug ON
    console.log('DC SDK loaded: ' + SalesforceInteractions);
    SalesforceInteractions.setLoggingLevel('debug');

    SalesforceInteractions.Personalization.Config.initialize({
        additionalTransformers: [
            {
                  name: 'Products Rec Template',
                  transformerType: 'Handlebars',
                  lastModifiedDate: new Date().getTime(),
                  substitutionDefinitions: {
                      blocktitle: { defaultValue: '[attributes].[Block_Title]'},
                      recs: { defaultValue: '[data]' },
                      name: { defaultValue: '[ssot__Name__c]' },
                      description: { defaultValue: '[ssot__Description__c]' },
                      image: { defaultValue: '[Image_URL__c]' }
                  },
                  transformerTypeDetails: {
                      html:
                            `<section class="related-products">
                                {{#if (subVar 'recs')}}
                                    <h2>{{subVar 'blocktitle'}}</h2>
                                    <div class="product-list">
                                        {{#each (subVar 'recs')}}
                                        <div class="product">
                                            <img src="{{subVar 'image' }}" alt="{{subVar 'name'}}" >
                                            <h3>{{subVar 'name'}}</h3>
                                            <p>{{subVar 'description'}}</p>
                                        </div>
                                        {{/each}}
                                    </div>
                                {{else}}
                                    <h2>You Might Also Like</h2>
                                    <div class="product-list">
                                        <div class="product">
                                            <img src="https://image.s4.sfmc-content.com/lib/fe3411727664067c751c76/m/1/6b430063-7d8a-496e-89b5-d574d34e29c2.png" alt="ePhone 14 Mini">
                                            <h3>ePhone 14 Mini</h3>
                                            <p>The miniature form ePhone</p>
                                        </div>
                                        <div class="product">
                                            <img src="https://image.s4.sfmc-content.com/lib/fe3411727664067c751c76/m/1/969c9b49-1d29-4e61-86c1-fd597b62fefb.png" alt="ePhone 14 Pro">
                                            <h3>ePhone 14 Pro</h3>
                                            <p>The most powerful phone yet</p>
                                        </div>
                                        <div class="product">
                                            <img src="https://s3.amazonaws.com/northerntrailoutfitters.com/quadstar/default/images/large/ePad5-Mini-blackf.jpg" alt="ePad 5 Mini">
                                            <h3>ePad 5 Mini</h3>
                                            <p>The best tiny tablet</p>
                                        </div>
                                    </div>
                                {{/if}}
                            </section>`

                }
            }
        ],
        personalizationExperienceConfigs: [
          {
            "name": "Home_Banner_Personnalization",
            "dataProvider": {
              "type": "PersonalizationPoint",
              "referenceType": "ApiName",
              "value": "Home_Banner_Personnalization"
            },
            "sourceMatchers": [
              {
                "type": "PageType",
                "value": "page"
              }
            ],
            "transformationConfig": {
              "when": "Immediately",
              "method": "ReplaceElementContent",
              "transformations": [
                {
                  "transformerName": "HTMLElementModifier",
                  "path": "html > body > div:nth-of-type(2)",
                  "tag": "DIV",
                  "substitutionValues": {
                    "style.backgroundImage": "[attributes].[BackgroundImageUrl]"
                  }
                },
                {
                  "transformerName": "HTMLElementModifier",
                  "tag": "H1",
                  "path": "DIV.hero-text>h1",
                  "substitutionValues": {
                    "innerText": "[attributes].[Header]"
                  }
                },
                {
                  "transformerName": "HTMLElementModifier",
                  "tag": "P",
                  "path": "html > body > div:nth-of-type(2) > div > p",
                  "substitutionValues": {
                    "innerText": "[attributes].[Subheader]"
                  }
                }
              ]
            },
            "lastModifiedDate": 1739545922100
          },
          {
            "name": "Single_Product_Recommendation",
            "dataProvider": {
              "type": "PersonalizationPoint",
              "referenceType": "ApiName",
              "value": "Single_Product_Recommendation"
            },
            "sourceMatchers": [
              {
                "type": "PageType",
                "value": "Product"
              }
            ],
            "transformationConfig": {
              "when": "Immediately",
              "method": "ReplaceElementContent",
              "transformations": [
                {
                  "transformerName": "HTMLElementModifier",
                  "path": "html > body > section > div > div > h3",
                  "tag": "H3",
                  "substitutionValues": {
                    "innerText": "[data].[0].[ssot__Name__c]"
                  }
                },
                {
                  "transformerName": "HTMLElementModifier",
                  "tag": "P",
                  "path": "html > body > section > div > div > p",
                  "substitutionValues": {
                    "innerText": "[data].[0].[ssot__Description__c]"
                  }
                },
                {
                  "transformerName": "HTMLElementModifier",
                  "tag": "IMG",
                  "path": "html > body > section > div > div > img",
                  "substitutionValues": {
                    "attributes.src": "[data].[0].[Image_URL__c]"
                  }
                }
              ]
            },
            "lastModifiedDate": 1739882556670
          }
        ]
    });

    // Init SDK: initialize with default optin
    // /!\ not production ready: update to declarative consent
    SalesforceInteractions.init({
        consents: [
            {
                provider: "ConsentProvider",
                purpose: SalesforceInteractions.ConsentPurpose.Tracking,
                status: SalesforceInteractions.ConsentStatus.OptIn
            }
        ],
        personalization: {
            dataspace: "default",
        }
    }).then(() => {
        console.log('Interactions WebSDK initialized');
    }).then(() => {
        var config = {
            global: {
              locale: document.querySelector('meta[name="locale"]').content,
              onActionEvent: (actionEvent) => {
              // Ensure objects exist
              actionEvent.user = actionEvent.user || {};
              actionEvent.user.attributes = actionEvent.user.attributes || {};
              actionEvent.user.attributes.eventType = actionEvent.user.attributes.eventType || "identity";
              const meta = document.querySelector('meta[name="locale"]');
              actionEvent.user.attributes.sourceLocale = meta ? meta.content : null;

              return actionEvent;
            },
                contentZones: ["div#hero-image"]
            },
            pageTypes: [
                {
                    // Track product pages only: 'isMatch' regex filters
                    name: "product",
                    isMatch: () => /\/tuxn3zbr2r4/.test(window.location.href),
                    interaction: {
                        name: "ViewCatalogObject",
                        catalogObject: {
                            type: "Product",
                            id: 'product_1',
                            interactionName: "View",
                            attributes: {
                                description: getProductDescription(),
                                name: getProductTitle(),
                                sourcePageSubtype: 'Auto'
                            }
                        }
                    }
                },
                {
                    // Track product pages only: 'isMatch' regex filters
                    name: "product",
                    isMatch: () => /\/kphq50fzfi4/.test(window.location.href),
                    interaction: {
                        name: "ViewCatalogObject",
                        catalogObject: {
                            type: "Product",
                            id: 'product_2',
                            interactionName: "View",
                            attributes: {
                                description: getProductDescription(),
                                name: getProductTitle(),
                                sourcePageSubtype: 'Home'

                            }
                        }
                    }
                },
                {
                    // Track product pages only: 'isMatch' regex filters
                    name: "product",
                    isMatch: () => /\/ozwtqwtouvl/.test(window.location.href),
                    interaction: {
                        name: "ViewCatalogObject",
                        catalogObject: {
                            type: "Product",
                            id: 'product_3',
                            interactionName: "View",
                            attributes: {
                                description: getProductDescription(),
                                name: getProductTitle(),
                                sourcePageSubtype: 'Alumni'
                            }
                        }
                    }
                },
                //track homepage views
                {
                    name: "homepage",
                    isMatch: () => /^\/$/.test(window.location.pathname) || window.location.pathname === "/b0xqymni1uo",
                    interaction: {
                        name: "Homepage View",
                        eventType: "PageView",
                    }
                },
                {
                    // Track every page of the website
                    name: "page",
                    isMatch: () => true,
                    interaction: {
                        name: getPageName(),
                        eventType: "PageView",
                        browse: {
                            pageName: getPageName(),
                            pageType: "page",
                            pageUrl: window.location.href
                        },
                        catalogObject: {
                            type: "PageView",
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
    "/tuxn3zbr2r4": "Auto",
    "/kphq50fzfi4": "Home",
    "/ozwtqwtouvl": "Alumni"
};

const currentPath = window.location.pathname;
  if (productPageMap[currentPath] && !window.productEventSent) {
    window.productEventSent = true;

    SalesforceInteractions.sendEvent({
        interaction: {
            name: "Sub Page Type",
            eventType: "userEngagement",
            category: "Engagement",
            sourcePageSubtype: productPageMap[currentPath]
        }
    });
}
};
//   ----------------------------------------------------------------
 window.submitAuthForm = function() {
        const inputs = document.getElementById("authenticationForm").elements;

        SalesforceInteractions.sendEvent({
            user: {
                attributes: {
                    eventType: 'identity',
                    firstName: inputs["firstname"].value,
                    lastName: inputs["lastname"].value,
                    email: inputs["email"].value,
                  phoneNumber: inputs["phone"].value,
birthdate: inputs["birthdate"].value,
                    sourcePageType: window.location.href,
                    isAnonymous: 0
                }
            }
        });
    /* Contact Point Email event */
    SalesforceInteractions.sendEvent({
        user: {
            attributes: {
                eemail: inputs["email"].value,
                eventType: "contactPointEmail",
            }
        }
    });
   /* Contact Point Email event */
    SalesforceInteractions.sendEvent({
        user: {
            attributes: {
                phoneNumber: inputs["phone"].value,
                eventType: "contactPointPhone",
            }
        }
    });
    /* Party Id event */
    SalesforceInteractions.sendEvent({
        user: {
            attributes: {
                eventType: 'partyIdentification',
                IDName: "Web",
                IDType: "WebTracking"
            }
        }
    });
     // Optional: hide form after submit
    window.hideAuthForm();
}
function addToCart(productId) {
    SalesforceInteractions.sendEvent({
        interaction: {
            name: "Add To Cart",
            lineItem: {
                catalogObjectType: "Product",
                catalogObjectId: getProductId(),
                quantity: 1,
                price: 148.00,
                currency: "USD"
            }
        }
    });
}
// ----------------------------------------------------------------
// SignUp Popup Campaign Functions
// ----------------------------------------------------------------
window.submitSimplePopup = function() {
    // 1. Get Email
    var emailInput = document.getElementById("dc-email");
    if (!emailInput) return;

    var email = emailInput.value;

    // 2. Validation
    if (!email || email.indexOf('@') === -1) {
        document.getElementById("dc-error").style.display = 'block';
        return;
    }
    document.getElementById("dc-error").style.display = 'none';

    // 3. Send Event to Data Cloud
    SalesforceInteractions.sendEvent({
        interaction: {
                        name: 'Popup Signup Form Submitted',
                        eventType: 'userEngagement',
                        category: "Engagement"
                    },
        user: {
            attributes: {
                eventType: 'identity',
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
                eventType: 'partyIdentification',
                IDName: "Signup Popup",
                IDType: "PopupSignup Submission"
            }
        }
    });
    /* Contact Point Email event */
    SalesforceInteractions.sendEvent({
        user: {
            attributes: {
                eemail: email,
                eventType: "contactPointEmail",
            }
        }
    });

    // 4. UI Success
    document.getElementById("dc-form-state").style.display = 'none';
    document.getElementById("dc-success-state").style.display = 'block';

};
// ----------------------------
// utility functions for each Campaign
// ----------------------------

  window.addEventListener("DOMContentLoaded", () => {
    // SHARED POPUP CONFIG
    // immediate = WPM shows it (desktop exit-intent), JS only fires events.
    // gated     = mobile/tablet + inactivity, JS reveals it.
    var SP_POPUPS = [
      { id: 'sp-campaign',        mode: 'immediate' },   // desktop - WPM handles exit-intent
      { id: 'sp-campaign-mobile', mode: 'gated'     }    // mobile  - JS handles inactivity
    ];
    var SP_POPUP_IDS = SP_POPUPS.map(function (p) { return p.id; });

    var INACTIVITY_MS = 5000;     // idle time for mobile (set 30000 for prod)

    // Dedup guards - each campaign fires each event at most once
    var viewedSent = {}, clickedSent = {}, dismissedSent = {};

    function isMobileOrTablet() {
      return /Mobi|Android|iPad|iPhone|iPod|Tablet/i.test(navigator.userAgent) ||
             window.matchMedia("(max-width: 1024px)").matches;
    }

    function sendViewed(name) {
      if (!name || viewedSent[name] || !window.SalesforceInteractions) return;
      viewedSent[name] = true;
      SalesforceInteractions.sendEvent({
        interaction: { name: "Viewed - " + name, eventType: 'userEngagement', category: "Engagement" }
      });
    }
    function sendClicked(name) {
      if (!name || clickedSent[name] || !window.SalesforceInteractions) return;
      clickedSent[name] = true;
      SalesforceInteractions.sendEvent({
        interaction: { name: "Clicked On Popup Campaign - " + name, eventType: 'userEngagement', category: "Engagement" }
      });
    }
    function sendDismissed(name) {
      if (!name || dismissedSent[name] || !window.SalesforceInteractions) return;
      dismissedSent[name] = true;
      SalesforceInteractions.sendEvent({
        interaction: { name: "Dismissed - " + name, eventType: 'userEngagement', category: "Engagement" }
      });
    }

    // Mobile gated: mobile/tablet only + inactivity, then reveal + fire Viewed
    function initGatedPopup(overlay) {
      if (!isMobileOrTablet()) { overlay.remove(); return; }   // desktop - remove, no event
      var timer;
      var events = ["mousemove", "keydown", "scroll", "touchstart", "click"];
      function show() {
        clearTimeout(timer);
        events.forEach(function (e) { window.removeEventListener(e, reset); });
        document.body.appendChild(overlay);
        overlay.style.display = "flex";
        requestAnimationFrame(function () { overlay.style.opacity = "1"; });
        sendViewed(overlay.getAttribute('data-name') || overlay.id);
      }
      function reset() { clearTimeout(timer); timer = setTimeout(show, INACTIVITY_MS); }
      events.forEach(function (e) { window.addEventListener(e, reset, { passive: true }); });
      reset();
    }

    function handlePopup(overlay, cfg) {
      if (cfg.mode === 'gated') {
        initGatedPopup(overlay);
      } else {
        // immediate: WPM already shows it (exit-intent), just fire Viewed once
        sendViewed(overlay.getAttribute('data-name') || overlay.id);
      }
    }

    // OBSERVER: watches for either popup being injected (each handled once)
    // No timeout/early-disconnect: exit-intent can inject anytime the user leaves.
    // The `handled` + `viewedSent` guards keep every event firing exactly once.
    var handled = {};
    var observer = new MutationObserver(function (mutations) {
      for (var m = 0; m < mutations.length; m++) {
        var nodes = mutations[m].addedNodes;
        for (var n = 0; n < nodes.length; n++) {
          var node = nodes[n];
          if (node.nodeType !== 1) continue;
          for (var p = 0; p < SP_POPUPS.length; p++) {
            var cfg = SP_POPUPS[p];
            if (handled[cfg.id]) continue;
            var overlay = node.id === cfg.id
                ? node
                : (node.querySelector ? node.querySelector('#' + cfg.id) : null);
            if (overlay) { handled[cfg.id] = true; handlePopup(overlay, cfg); }
          }
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // CLICK: first meaningful click per popup (ignores close button)
    document.addEventListener("click", function (event) {
      if (event.target.closest('#dc-close-btn')) return;   // close = dismiss, not click
      for (var i = 0; i < SP_POPUP_IDS.length; i++) {
        var overlay = event.target.closest('#' + SP_POPUP_IDS[i]);
        if (overlay) { sendClicked(overlay.getAttribute('data-name') || overlay.id); return; }
      }
    });

    // DISMISS: hide popup + fire Dismissed once
    window.spDismissPopup = function (personalizationPointName) {
      SP_POPUP_IDS.forEach(function (id) {
        var overlay = document.getElementById(id);
        if (overlay) overlay.style.display = 'none';
      });
      sendDismissed(personalizationPointName);
    };
  });


// ----------------------------
// Helpers & utility functions
// ----------------------------

// Get descriptive page name
function getPageName() {
    const path = window.location.pathname;
    const segments = path.split('/').filter(Boolean);

    // Si pas de segment, c'est la home
    if (segments.length === 0) return "Homepage";

    // On nettoie et transforme chaque segment
    const cleanedSegments = segments.map(segment => {
        // Enleve l'extension .html si presente
        const withoutExt = segment.replace('.html', '');
        // Convertit en camelCase et enleve les caracteres non-alphanumeriques
        return withoutExt
            .split(/[^a-zA-Z0-9]+/)
            .map((word, index) => {
                if (index === 0) {
                    // Premier mot commence par une majuscule
                    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
                }
                // Mots suivants en camelCase
                return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
            })
            .join('');
    });

    // Join avec des underscores et limite a 80 caracteres
    return cleanedSegments.join('_').slice(0, 80);
}

// Get page category
function getPageCategory() {
    const segments = window.location.pathname.split('/').filter(Boolean);
    return segments[0] || 'home';
}

function getProductId() {
    const segments = window.location.pathname.split('/').filter(Boolean);
    const product = segments[segments.length - 1].replace('.html', '');
    return product || 'product1';
}

function getProductTitle() {
    try {
        return document.getElementsByClassName("product-description")[0].getElementsByTagName("h1")[0].innerText;
    }
    catch {
        return "";
    }
}

function getProductDescription() {
    try {
        return document.getElementsByClassName("product-description")[0].getElementsByTagName("p")[0].innerText;
    }
    catch {
        return "";
    }
}

// Display/Hide login form on header button click
 window.displayAuthForm = function() {
        document.getElementById("loginform").style.visibility = "visible";
    }

    window.hideAuthForm = function() {
        document.getElementById("loginform").style.visibility = "hidden";
    }
