import json
from html import escape
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle

ROOT = Path(__file__).resolve().parent.parent
CONFIG = json.loads((ROOT / 'config/customer-care.json').read_text(encoding='utf-8'))
OUTPUT = ROOT / 'assets/pdf'
OUTPUT.mkdir(parents=True, exist_ok=True)
pdfmetrics.registerFont(TTFont('Care', 'C:/Windows/Fonts/segoeui.ttf'))
pdfmetrics.registerFont(TTFont('CareBold', 'C:/Windows/Fonts/segoeuib.ttf'))
pdfmetrics.registerFontFamily('Care', normal='Care', bold='CareBold', italic='Care', boldItalic='CareBold')
INK = colors.HexColor('#172027')
MUTED = colors.HexColor('#59636c')
ACCENT = colors.HexColor('#14796c')
styles = {
    'title': ParagraphStyle('Title', fontName='CareBold', fontSize=25, leading=31, textColor=INK, spaceAfter=13),
    'intro': ParagraphStyle('Intro', fontName='Care', fontSize=11, leading=17, textColor=MUTED, spaceAfter=19),
    'heading': ParagraphStyle('Heading', fontName='CareBold', fontSize=12, leading=17, textColor=ACCENT, spaceBefore=13, spaceAfter=7),
    'body': ParagraphStyle('Body', fontName='Care', fontSize=10, leading=16, textColor=INK, spaceAfter=8),
    'note': ParagraphStyle('Note', fontName='Care', fontSize=9, leading=14, textColor=MUTED, spaceAfter=8),
}

def page(canvas, doc):
    width, height = A4
    canvas.setFillColor(INK)
    canvas.setFont('CareBold', 14)
    canvas.drawString(48, height - 47, CONFIG['brand'])
    canvas.setFont('Care', 8)
    canvas.setFillColor(MUTED)
    canvas.drawRightString(width - 48, height - 45, 'CUSTOMER CARE')
    canvas.setStrokeColor(colors.HexColor('#d9e2e1'))
    canvas.line(48, height - 62, width - 48, height - 62)
    canvas.line(48, 41, width - 48, 41)
    canvas.setFont('Care', 8)
    canvas.drawString(48, 27, 'Updated ' + CONFIG['updated'])
    canvas.drawRightString(width - 48, 27, str(doc.page))

def p(text, style='body'):
    return Paragraph(text, styles[style])

def section(story, title, paragraphs):
    story.append(p(escape(title), 'heading'))
    story.extend(p(text) for text in paragraphs)

def document(slug, title, intro, sections, table=None):
    story = [p(escape(title), 'title'), p(intro, 'intro')]
    for heading, paragraphs in sections:
        section(story, heading, paragraphs)
        if table and heading == table['after']:
            rows = [[p(escape(str(cell)), 'body') for cell in row] for row in table['rows']]
            grid = Table(rows, colWidths=table['widths'], hAlign='LEFT')
            grid.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e9f2f0')),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('LEFTPADDING', (0, 0), (-1, -1), 12),
                ('RIGHTPADDING', (0, 0), (-1, -1), 12),
                ('TOPPADDING', (0, 0), (-1, -1), 8),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
                ('LINEBELOW', (0, 0), (-1, -1), 0.5, colors.HexColor('#d9e2e1')),
            ]))
            story.extend([grid, Spacer(1, 10)])
    output = OUTPUT / (slug + '.pdf')
    SimpleDocTemplate(str(output), pagesize=A4, rightMargin=48, leftMargin=48, topMargin=91, bottomMargin=57, title=title, author=CONFIG['brand']).build(story, onFirstPage=page, onLaterPages=page)
    print(output)

document('shipping_policy', 'Shipping Policy', 'Delivery information for clothing, footwear and accessories ordered from Fashion Company.', [
    ('Your delivery address', ['Provide the recipient name, mobile number, complete street address, city, state and PIN before confirming an order. Check these details carefully so that delivery can be arranged to the correct location.']),
    ('Availability and delivery charges', ['Availability depends on the product and delivery address. The checkout summary shows the delivery charge and order total before confirmation. Cash on delivery is available only when the selected products allow it.']),
    ('Dispatch and delivery updates', ['An order first appears as Order Placed. Once the store updates its status, the latest information appears in My Orders. Any date shown before dispatch is an estimate, not a guaranteed delivery appointment.']),
    ('Tracking and delivery concerns', ['Courier tracking information is available only after a valid shipment reference is assigned. The order reference on your bill identifies the purchase; it is not automatically a courier tracking number.', 'Keep your order ID, delivery PIN and payment status ready when contacting customer care about an incorrect address, delay or missing package.']),
])
document('returns_exchanges', 'Returns & Exchanges', 'Replacement availability is specific to each product and the terms recorded for your purchase.', [
    ('Check the product terms', ['The product page states whether replacement is allowed and the replacement window in days. Many current catalog products show a 7-day window, but the terms of the selected product and purchase apply. Confirm those terms before making a request.']),
    ('Keep the item ready for assessment', ['Keep the order bill, original tags and packaging. Avoid wearing, washing or altering an item that you want assessed for replacement. For a damaged or incorrect delivery, keep clear photographs of the item and packaging.']),
    ('Requesting a replacement', ['Contact customer care with the order ID, product name, selected size or color, delivery date and reason for the request. Eligibility and the next steps must be confirmed before sending the item back.']),
    ('Size changes and refunds', ['A different size or color is subject to availability and approval. Replacement and refund are different outcomes; a refund method or processing date should not be assumed before it is confirmed for the order.']),
])
document('size_guide', 'Size Guide', 'Choose the size offered for the exact product. Clothing labels, age bands and footwear numbers are not interchangeable.', [
    ("Men's shirt reference", ['The existing store reference below uses inches. It is a general reference, not a guarantee that every shirt has the same garment measurements.']),
    ('Measure before choosing', ['Measure your chest around its fullest part without pulling the tape tight. For shoulders, compare the shoulder seam distance of a similar well-fitting shirt. Compare the style and fit as well as the size label.']),
    ('Women, kids and footwear', ["Women's styles commonly offer XS, S, M, L and XL. Check product-specific measurements when available.", 'Kids products use age-band labels such as 2-3Y, 4-5Y, 6-7Y, 8-9Y and 10-11Y. Age alone does not guarantee fit.', 'Footwear currently uses numeric labels 6 to 10. Confirm the sizing system and foot-length measurement for the selected style before choosing.']),
    ('One Size and available stock', ['One Size is used for selected accessories. Check dimensions and any adjustable fit information. Only sizes with available stock can be ordered.']),
], table={'after': "Men's shirt reference", 'rows': [['Size', 'Chest (in)', 'Shoulder (in)'], ['S', '38', '17'], ['M', '40', '18'], ['L', '42', '19']], 'widths': [150, 170, 179]})
document('track_my_order', 'Track My Order', 'Find the current store status and the bill for your own order.', [
    ('Sign in to the ordering account', ['Use the same email address used for the purchase. Open My Orders to retrieve the orders linked to that account. A different account does not provide access to another customer\'s purchases.']),
    ('Read the current status', ['Order Placed means the order has been recorded. Shipped means the store has confirmed that status. A cancelled order remains identifiable by its order reference. Refresh My Orders to retrieve the latest saved status.']),
    ('Order reference or courier reference?', ['The order ID and the order barcode identify the purchase. A courier AWB or shipment tracking number is a separate reference and is shown only when one has been assigned. Do not enter an internal order ID into a courier tracker unless the store instructs you to do so.']),
    ('Bills and further help', ['Where available, use the bill actions in My Orders to view, print or download the order bill. For a delivery question, keep your order ID, recipient details and PIN ready for customer care.']),
])
contact = [
    ('Customer care', ['For product questions, sizing assistance, delivery concerns or replacement requests, prepare your order ID and a short description of the issue. Do not include your account password or payment-card security details.']),
    ('Default contact details', [f'<b>Email:</b> {escape(CONFIG["supportEmail"])}', f'<b>Phone:</b> {escape(CONFIG["supportPhone"])}', f'<b>Business address:</b> {escape(CONFIG["businessAddress"])}', f'<b>Support hours:</b> {escape(CONFIG["supportHours"])}']),
]
if CONFIG['placeholderContacts']:
    contact.append(('Contact details pending confirmation', ['The contact details above are placeholders. A working support email, phone number and business address will be published after they are confirmed by the store.']))
contact.append(('Information to include', ['Include the order ID, the email used for the purchase, the product name and the issue you need help with. If an item is damaged or incorrect, keep photographs of the item and packaging ready.']))
document('contact_us', 'Contact Us', 'Fashion Company customer-care information for products and orders.', contact)
