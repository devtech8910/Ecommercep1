(function (root) {
  'use strict';
  const revision = 'studio-2026-10';
  // Every design has its own original photograph, with no third-party branding.
  const families = {
    mens: [
      ['Oxford Shirt', 'Cotton Oxford', 'Tailored fit', 1799, ['navy button-down shirt with chest pocket', 'white spread-collar shirt with concealed placket', 'sky blue band-collar shirt with curved hem', 'sage short-sleeve camp-collar shirt', 'burgundy fine-striped shirt with contrast cuffs']],
      ['Linen Shirt', 'Linen blend', 'Relaxed fit', 2199, ['ivory long-sleeve band-collar shirt', 'olive short-sleeve open-collar shirt', 'rust half-placket popover shirt', 'blue striped button-down shirt', 'charcoal Cuban-collar shirt with two pockets']],
      ['Polo', 'Cotton pique', 'Regular fit', 1499, ['forest green tipped-collar polo', 'cream textured zip-neck polo', 'navy rugby-striped long-sleeve polo', 'burgundy open-collar knit polo', 'grey contrast-placket short-sleeve polo']],
      ['Chinos', 'Cotton twill', 'Straight fit', 2299, ['khaki pleated trousers', 'navy tapered flat-front trousers', 'olive cargo trousers with flap pockets', 'stone drawstring trousers', 'charcoal cropped cuffed trousers']],
      ['Denim', 'Cotton denim', 'Regular fit', 2799, ['indigo straight-leg five-pocket jeans', 'black tapered jeans', 'light blue wide-leg carpenter jeans', 'grey slim jeans with stitched knee panels', 'ecru relaxed jeans with patch pockets']],
      ['Overshirt', 'Cotton canvas', 'Relaxed fit', 2899, ['olive four-pocket utility overshirt', 'navy corduroy overshirt', 'tan checked flannel overshirt', 'charcoal zip-front overshirt', 'ivory textured round-collar overshirt']],
      ['Blazer', 'Wool blend', 'Tailored fit', 5499, ['navy single-breasted notch-lapel blazer', 'charcoal double-breasted blazer', 'sand unstructured linen blazer', 'brown herringbone blazer', 'black shawl-collar evening blazer']],
      ['Knitwear', 'Cotton knit', 'Regular fit', 2499, ['ivory cable-knit crewneck sweater', 'navy fine-knit V-neck sweater', 'olive button-front cardigan', 'grey half-zip ribbed sweater', 'burgundy roll-neck sweater']],
      ['Jacket', 'Cotton blend', 'Regular fit', 3999, ['tan cropped Harrington jacket', 'black zip bomber jacket', 'olive belted field jacket', 'indigo contrast-stitched denim jacket', 'grey quilted collarless jacket']],
      ['T-Shirt', 'Cotton jersey', 'Regular fit', 999, ['white heavyweight crewneck T-shirt', 'navy striped long-sleeve T-shirt', 'sage henley T-shirt', 'black oversized pocket T-shirt', 'rust ribbed short-sleeve T-shirt']]
    ],
    womens: [
      ['Midi Dress', 'Cotton blend', 'Regular fit', 2999, ['navy belted shirt dress', 'ivory puff-sleeve wrap dress', 'sage tiered sleeveless dress', 'burgundy pleated long-sleeve dress', 'blue floral square-neck dress']],
      ['Blouse', 'Viscose blend', 'Relaxed fit', 1699, ['ivory tie-neck blouse', 'navy satin wrap blouse', 'rose ruffled-cuff blouse', 'sage button-front linen blouse', 'black pleated sleeveless blouse']],
      ['Kurta', 'Cotton', 'Regular fit', 1999, ['indigo block-print straight kurta', 'ivory embroidered long kurta', 'sage band-collar A-line kurta', 'maroon woven-striped kurta', 'rose gathered-yoke kurta']],
      ['Trousers', 'Cotton twill', 'Straight fit', 2499, ['black high-waist pleated trousers', 'ivory wide-leg trousers', 'olive cropped paperbag trousers', 'navy tapered ankle trousers', 'grey pinstriped palazzo trousers']],
      ['Denim', 'Cotton denim', 'Regular fit', 2799, ['indigo high-rise straight jeans', 'light blue wide-leg jeans', 'black tapered ankle jeans', 'ecru cropped flare jeans', 'grey patch-pocket carpenter jeans']],
      ['Skirt', 'Cotton blend', 'Regular fit', 2199, ['navy pleated midi skirt', 'ivory button-front A-line skirt', 'black satin bias skirt', 'blue denim wrap skirt', 'rose tiered cotton skirt']],
      ['Blazer', 'Linen blend', 'Tailored fit', 4999, ['ivory single-breasted blazer', 'black double-breasted blazer', 'sage cropped collarless blazer', 'navy pinstriped long blazer', 'rose belted blazer']],
      ['Cardigan', 'Cotton knit', 'Relaxed fit', 2499, ['ivory cable-knit cardigan', 'navy longline open cardigan', 'rose cropped pearl-button cardigan', 'sage ribbed wrap cardigan', 'grey zip-neck knit cardigan']],
      ['Co-ord Set', 'Linen blend', 'Relaxed fit', 3999, ['sage camp-collar shirt and wide-leg trousers set', 'ivory sleeveless tunic and cropped trousers set', 'navy striped top and matching midi skirt set', 'rust wrap top and culottes set', 'black textured short jacket and trousers set']],
      ['Top', 'Cotton jersey', 'Regular fit', 1299, ['ivory boat-neck long-sleeve top', 'navy Breton-striped top', 'rose ribbed square-neck top', 'sage sleeveless mock-neck top', 'black asymmetric short-sleeve top']]
    ],
    kids: [
      ['Cotton Shirt', 'Soft cotton', 'Comfort fit', 899, ['sky blue button-down child shirt', 'ivory band-collar child shirt', 'navy checked short-sleeve child shirt', 'sage camp-collar child shirt', 'rust striped long-sleeve button-front child shirt with collar and chest pocket']],
      ['Playtime Tee', 'Cotton jersey', 'Comfort fit', 599, ['yellow pocket child T-shirt', 'blue striped child T-shirt', 'sage henley child T-shirt', 'ivory colour-block child T-shirt', 'rose ruffle-sleeve child T-shirt']],
      ['Sweatshirt', 'Cotton fleece', 'Comfort fit', 1199, ['navy raglan child sweatshirt', 'sage half-zip child sweatshirt', 'ivory quilted child sweatshirt', 'rust contrast-collar child sweatshirt', 'rose hooded child sweatshirt']],
      ['Trousers', 'Cotton twill', 'Comfort fit', 1099, ['khaki elastic-waist child chinos', 'navy child cargo trousers', 'sage ribbed-cuff child joggers', 'grey pleated child trousers', 'rust child corduroy trousers']],
      ['Denim', 'Cotton denim', 'Comfort fit', 1399, ['indigo child straight jeans', 'light blue child denim dungarees', 'black child tapered jeans', 'ecru child denim shorts', 'blue pocketed child denim skirt']],
      ['Dress', 'Soft cotton', 'Comfort fit', 1499, ['blue gingham collared child dress', 'ivory embroidered child dress', 'rose tiered child dress', 'sage pinafore child dress', 'navy striped child shirt dress']],
      ['Knitwear', 'Cotton knit', 'Comfort fit', 1299, ['ivory cable-knit child sweater', 'navy child V-neck sweater', 'sage button-front child cardigan', 'rose scalloped child cardigan', 'grey half-zip child sweater']],
      ['Jacket', 'Cotton blend', 'Comfort fit', 1999, ['navy child bomber jacket', 'olive child utility jacket', 'blue child denim jacket', 'yellow child hooded rain jacket', 'rose child quilted jacket']],
      ['Shorts', 'Cotton twill', 'Comfort fit', 799, ['khaki cuffed child shorts', 'navy child cargo shorts', 'sage drawstring child shorts', 'blue striped child shorts', 'rose scalloped child shorts']],
      ['Lounge Set', 'Cotton jersey', 'Comfort fit', 1299, ['blue striped child pyjama set', 'sage short-sleeve child lounge set', 'ivory dotted child pyjama set', 'navy collared child sleepwear set', 'rose ribbed child lounge set']]
    ],
    accessories: [
      ['Tote', 'Leather', 'One Size', 3499, ['tan structured leather tote with long handles', 'black pebbled leather zip tote', 'burgundy trapezoid leather tote', 'ivory canvas tote with leather trim', 'olive suede tote with curved handles']],
      ['Crossbody', 'Leather', 'One Size', 2499, ['tan curved-flap saddle crossbody', 'black rectangular quilted crossbody', 'burgundy drawstring bucket crossbody', 'ivory crescent shoulder bag', 'navy compact envelope crossbody']],
      ['Sneakers', 'Leather and rubber', 'Regular fit', 2999, ['white minimalist low-top sneakers pair', 'ivory canvas high-top sneakers pair', 'grey suede retro trainers pair', 'navy leather slip-on sneakers pair', 'white perforated court sneakers with tan heels pair']],
      ['Loafers', 'Leather', 'Regular fit', 3299, ['brown penny loafers pair', 'black tassel loafers pair', 'tan suede driving loafers pair', 'burgundy horsebit loafers pair', 'ivory woven leather loafers pair']],
      ['Watch', 'Stainless steel', 'One Size', 4299, ['silver round analog watch with brown leather strap', 'black rectangular analog watch with mesh strap', 'gold round analog watch with cream dial', 'silver cushion-case analog watch with navy strap', 'rose gold oval analog watch with slim bracelet']],
      ['Sunglasses', 'Acetate', 'One Size', 1499, ['black rectangular sunglasses', 'tortoiseshell round sunglasses', 'gold wire-frame aviator sunglasses', 'ivory cat-eye sunglasses', 'olive translucent square sunglasses']],
      ['Wallet', 'Leather', 'One Size', 1299, ['tan leather bifold wallet opened slightly', 'black zip-around leather wallet', 'burgundy slim leather card holder', 'navy leather trifold wallet', 'olive leather clasp coin purse']],
      ['Belt', 'Leather', 'Adjustable fit', 999, ['tan leather belt with brass square buckle', 'black leather belt with silver round buckle', 'brown braided leather belt', 'burgundy narrow leather belt with gold buckle', 'navy woven belt with leather ends']],
      ['Scarf', 'Cotton silk blend', 'One Size', 1199, ['ivory silk scarf with navy geometric border', 'burgundy paisley silk scarf', 'sage pleated silk scarf', 'navy striped fringed cotton scarf', 'rose floral square silk scarf']],
      ['Travel Bag', 'Canvas and leather', 'One Size', 4499, ['tan leather weekend duffel', 'navy canvas barrel travel bag', 'olive roll-top cabin backpack', 'black structured leather overnight bag', 'ivory canvas travel organizer with leather trim']]
    ]
  };
  const names = ['Verona', 'Milano', 'Heritage', 'Oxford', 'Siena', 'Regent', 'Riviera', 'Monaco', 'Florence', 'Camden'];
  const colorNames = ['forest green', 'light blue', 'sky blue', 'rose gold', 'tortoiseshell', 'burgundy', 'charcoal', 'ivory', 'navy', 'white', 'sage', 'olive', 'rust', 'blue', 'cream', 'grey', 'khaki', 'stone', 'indigo', 'black', 'ecru', 'tan', 'sand', 'brown', 'rose', 'yellow', 'silver', 'gold', 'maroon'];

  function buildCatalog() {
    return Object.entries(families).flatMap(([category, groups]) => groups.flatMap((family, familyIndex) => family[4].map((design, variant) => {
      const index = familyIndex * 5 + variant;
      const id = `seed_${category}_${String(index + 1).padStart(3, '0')}`;
      const color = (colorNames.find(key => design.startsWith(key)) || 'multicolour').replace(/\b\w/g, c => c.toUpperCase());
      const footwear = category === 'accessories' && ['Sneakers', 'Loafers'].includes(family[0]);
      const sizes = footwear ? ['6', '7', '8', '9', '10'] : category === 'accessories' ? ['One Size'] : category === 'kids' ? ['2-3Y', '4-5Y', '6-7Y', '8-9Y', '10-11Y'] : category === 'womens' ? ['XS', 'S', 'M', 'L', 'XL'] : ['S', 'M', 'L', 'XL', 'XXL'];
      const price = family[3] + variant * 100;
      const onSale = index % 3 === 0;
      const mrp = onSale ? price + (price > 2500 ? 700 : 300) : price;
      const collection = category === 'mens' ? "Men's " : category === 'womens' ? "Women's " : category === 'kids' ? 'Junior ' : '';
      const title = `${names[(familyIndex + variant) % names.length]} ${collection}${family[0]} - ${color}`;
      const image = `/assets/catalog/${id}.webp`;
      const stock = Object.fromEntries(sizes.map((size, i) => [size, 8 + ((index + i * 3) % 17)]));
      const stockText = Object.entries(stock).map(([size, quantity]) => `${size}:${quantity}`).join(', ');
      const material = /suede/.test(design) ? 'Suede' : /canvas/.test(design) ? 'Cotton canvas' : /linen/.test(design) ? 'Linen blend' : /denim|jeans/.test(design) ? 'Cotton denim' : /satin/.test(design) ? 'Satin blend' : /silk/.test(design) ? 'Cotton silk blend' : /leather/.test(design) ? 'Leather' : family[0] === 'Sunglasses' && /wire-frame/.test(design) ? 'Metal frame' : family[0] === 'Belt' && /woven/.test(design) ? 'Woven textile with leather trim' : family[0] === 'Travel Bag' && /backpack/.test(design) ? 'Nylon canvas' : /corduroy/.test(design) ? 'Cotton corduroy' : /flannel/.test(design) ? 'Cotton flannel' : family[1];
      const highlights = `${material}\n${family[2]}\n${design.charAt(0).toUpperCase() + design.slice(1)}`;
      const suitable = category === 'kids' ? 'Everyday and playtime' : family[0] === 'Travel Bag' ? 'Travel' : 'Everyday styling';
      return {
        id, pid: id, title, brand: 'Fashion Company', category, productType: family[0], catalog_revision: revision,
        titleDescription: highlights, title_description: highlights,
        price, mrp, discount: Math.round((mrp - price) / mrp * 100),
        imageUrl: image, image_url: image, images: [image], colors: [color],
        sizes: sizes.join(', '), sizeStock: stockText, size_stock: stockText,
        stock: Object.values(stock).reduce((total, quantity) => total + quantity, 0), stockStatus: 'in-stock',
        rating: 0, reviewCount: 0, reviews: [], badge: index < 5 ? 'New' : '', active: true,
        replacementAllowed: true, replacement_allowed: true, replacementDays: 7, replacement_days: 7,
        codAvailable: true, cod_available: true, couponApplicable: onSale, coupon_applicable: onSale,
        fabric: material, fit: family[2], pattern: /strip|check|gingham|paisley|floral|dot|geometric/.test(design) ? 'Patterned' : 'Solid',
        suitableFor: suitable, suitable_for: suitable,
        description: `${title} from the Fashion Company collection. ${design.charAt(0).toUpperCase() + design.slice(1)} in ${material.toLowerCase()}${family[2] === 'One Size' ? '' : ', with a ' + family[2].toLowerCase()}. The ${color.toLowerCase()} finish pairs easily with an everyday wardrobe. Available in ${sizes.join(', ')}.`,
        imagePrompt: `Use case: product-mockup. Original photorealistic commercial fashion catalog photograph of ${category === 'womens' ? "women's " : category === 'mens' ? "men's " : ''}${design}. Entire product fully visible, ${category === 'kids' ? 'child-sized garment displayed without a child, ' : ''}${footwear ? 'both shoes shown as a pair, ' : ''}no models or body parts, no props. Clean light grey seamless studio backdrop (#eeeeec), soft diffused lighting, realistic subtle contact shadow, fine material texture, centered square composition, product fills 76% of frame with comfortable margins. Classic sophisticated real product photography, no logos, text, brands, labels or watermarks. Show only the described product${family[0].includes('Set') ? ' set' : ''}.`
      };
    })));
  }

  function upgradeSeedCatalog(products) {
    const replacements = new Map(buildCatalog().map(product => [product.id, product]));
    return products.map(product => {
      const replacement = replacements.get(String(product.id || product.pid));
      if (!replacement || product.catalog_revision === revision) return product;
      const { imagePrompt, ...fields } = replacement;
      return { ...product, ...fields, created_at: product.created_at, active: product.active !== false };
    });
  }
  const api = { buildCatalog, upgradeSeedCatalog, revision };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.dtfBuildSeedCatalog = () => buildCatalog().map(({ imagePrompt, ...product }) => product);
})(typeof window !== 'undefined' ? window : null);
