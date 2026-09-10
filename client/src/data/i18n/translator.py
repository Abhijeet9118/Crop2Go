import os
import re

hi_dict = {
    'Buyer Dashboard': 'खरीदार डैशबोर्ड',
    'Total Orders': 'कुल ऑर्डर्स',
    'Browse Available Lots': 'उपलब्ध लॉट ब्राउज़ करें',
    'Pending Delivery': 'लंबित डिलीवरी',
    'Purchased (kg)': 'खरीदा गया (किलो)',
    'Total Spent': 'कुल खर्च',
    'Track Shipments': 'शिपमेंट ट्रैक करें',
    'Confirm Order': 'ऑर्डर की पुष्टि करें',
    'farmers': 'किसानों',
    'A Grade': 'A ग्रेड',
    'B Grade': 'B ग्रेड',
    'C Grade': 'C ग्रेड',
    'Mixed': 'मिश्रित',
    'kg available': 'किलो उपलब्ध',
    'No lots available right now': 'अभी कोई लॉट उपलब्ध नहीं है',
    'Order': 'ऑर्डर',
    'Save': 'सहेजें',
    'Cancel': 'रद्द करें',
    'Search': 'खोजें',
    'Delete': 'हटाएं',
    'Edit': 'संपादित करें',
    'Dashboard': 'डैशबोर्ड',
    'Total': 'कुल',
    'Date': 'तारीख',
    'Status': 'स्थिति',
    'Actions': 'कार्रवाइयां',
    'Quantity': 'मात्रा',
    'Price': 'मूल्य',
    'Crop': 'फ़सल',
    'Farmer': 'किसान',
    'Payment': 'भुगतान',
    'Transport': 'परिवहन',
    'Equipment': 'उपकरण',
    'Weather': 'मौसम',
    'My Crops': 'मेरी फ़सलें',
    'Expenses': 'खर्च',
    'Mandi Prices': 'मंडी भाव',
    'Find FPO': 'FPO खोजें',
    'My Produce': 'मेरी उपज',
    'Collection': 'संग्रह',
    'Weighing': 'वजन',
    'Grading': 'ग्रेडिंग',
    'Aggregation': 'एकत्रीकरण',
    'Inventory': 'इन्वेंटरी',
    'AI Insights': 'AI इनसाइट्स',
    'Processing': 'प्रोसेसिंग',
    'Dispatch': 'डिस्पैच',
    'Buyers': 'खरीदार',
    'Sign In': 'साइन इन करें',
    'Register': 'रजिस्टर करें',
    'Phone Number': 'फ़ोन नंबर',
    'Password': 'पासवर्ड',
    'Welcome': 'स्वागत है',
    'View Details': 'विवरण देखें',
    'Submit': 'जमा करें',
    'Close': 'बंद करें',
    'Confirm': 'पुष्टि करें',
    'Back': 'वापस',
    'Next': 'अगला',
    'Filter': 'फ़िल्टर',
    'No Data': 'कोई डेटा नहीं',
    'Error': 'त्रुटि',
    'Success': 'सफलता'
}

mr_dict = {
    'Buyer Dashboard': 'खरेदीदार डॅशबोर्ड',
    'Total Orders': 'एकूण ऑर्डर्स',
    'Browse Available Lots': 'उपलब्ध लॉट ब्राउझ करा',
    'Pending Delivery': 'प्रलंबित वितरण',
    'Purchased (kg)': 'खरेदी केले (किलो)',
    'Total Spent': 'एकूण खर्च',
    'Track Shipments': 'शिपमेंट ट्रॅक करा',
    'Confirm Order': 'ऑर्डरची पुष्टी करा',
    'farmers': 'शेतकऱ्यांना',
    'A Grade': 'A दर्जा',
    'B Grade': 'B दर्जा',
    'C Grade': 'C दर्जा',
    'Mixed': 'मिश्र',
    'kg available': 'किलो उपलब्ध',
    'No lots available right now': 'सध्या कोणतेही लॉट उपलब्ध नाहीत',
    'Order': 'ऑर्डर',
    'Save': 'जतन करा',
    'Cancel': 'रद्द करा',
    'Search': 'शोधा',
    'Delete': 'हटवा',
    'Edit': 'संपादित करा',
    'Dashboard': 'डॅशबोर्ड',
    'Total': 'एकूण',
    'Date': 'तारीख',
    'Status': 'स्थिती',
    'Actions': 'क्रिया',
    'Quantity': 'प्रमाण',
    'Price': 'किंमत',
    'Crop': 'पीक',
    'Farmer': 'शेतकरी',
    'Payment': 'पेमेंट',
    'Transport': 'वाहतूक',
    'Equipment': 'उपकरणे',
    'Weather': 'हवामान',
    'My Crops': 'माझी पिके',
    'Expenses': 'खर्च',
    'Mandi Prices': 'बाजारभाव',
    'Find FPO': 'FPO शोधा',
    'My Produce': 'माझे उत्पादन',
    'Collection': 'संकलन',
    'Weighing': 'वजन',
    'Grading': 'प्रतवारी',
    'Aggregation': 'एकत्रीकरण',
    'Inventory': 'इन्व्हेंटरी',
    'AI Insights': 'AI अंतर्दृष्टी',
    'Processing': 'प्रक्रिया',
    'Dispatch': 'डिस्पॅच',
    'Buyers': 'खरेदीदार',
    'Sign In': 'साइन इन करा',
    'Register': 'नोंदणी करा',
    'Phone Number': 'फोन नंबर',
    'Password': 'पासवर्ड',
    'Welcome': 'स्वागत आहे',
    'View Details': 'तपशील पहा',
    'Submit': 'सबमिट करा',
    'Close': 'बंद करा',
    'Confirm': 'पुष्टी करा',
    'Back': 'मागे',
    'Next': 'पुढे',
    'Filter': 'फिल्टर',
    'No Data': 'डेटा नाही',
    'Error': 'त्रुटी',
    'Success': 'यश'
}

def translate(text, lang_dict):
    # Try exact match
    if text in lang_dict:
        return lang_dict[text]
    # Replace phrases
    res = text
    for eng, trans in sorted(lang_dict.items(), key=lambda x: len(x[0]), reverse=True):
        if eng in res:
            res = res.replace(eng, trans)
    return res

input_file = r"C:\Users\abhij\.gemini\antigravity\scratch\CROP2GO\client\src\data\i18n\en_complete.js"
hi_out = r"C:\Users\abhij\.gemini\antigravity\scratch\CROP2GO\client\src\data\i18n\hi.js"
mr_out = r"C:\Users\abhij\.gemini\antigravity\scratch\CROP2GO\client\src\data\i18n\mr.js"

with open(input_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Extract keys and values using regex
pattern = r"'(.*?)':\s*'(.*?)'(,?)"
matches = re.findall(pattern, content)

def generate_file(out_path, matches, lang_dict):
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write("export default {\n")
        for i, (k, v, comma) in enumerate(matches):
            translated_v = translate(v, lang_dict)
            # escape single quotes
            translated_v = translated_v.replace("'", "\\'")
            f.write(f"  '{k}': '{translated_v}',\n")
        f.write("};\n")

generate_file(hi_out, matches, hi_dict)
generate_file(mr_out, matches, mr_dict)

print("Generated hi.js and mr.js")
