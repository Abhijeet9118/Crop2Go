import os
import json

keys = {
    'common_save': 'Save',
    'common_cancel': 'Cancel',
    'common_loading': 'Loading...',
    'common_search': 'Search',
    'common_delete': 'Delete',
    'common_edit': 'Edit',
    'common_actions': 'Actions',
    'common_status': 'Status',
    'common_date': 'Date',
    'common_total': 'Total',
    'common_submit': 'Submit',
    'common_close': 'Close',
    'common_confirm': 'Confirm',
    'common_back': 'Back',
    'common_next': 'Next',
    'common_filter': 'Filter',
    'common_view_details': 'View Details',
    'common_no_data': 'No Data',
    'common_error': 'Error',
    'common_success': 'Success',
    'common_welcome': 'Welcome',
    'common_quantity': 'Quantity',
    'common_weight': 'Weight',
    'common_price': 'Price',
    'common_kg': 'Kg',
    'common_per_kg': 'Per Kg',
    'common_rupees': 'Rupees',
    'common_phone': 'Phone',
    'common_password': 'Password',
    'common_name': 'Name',
    'common_village': 'Village',
    'common_district': 'District',
    'common_state': 'State',
    'common_crop': 'Crop',
    'common_grade': 'Grade',
    'common_lot': 'Lot',
    'common_order': 'Order',
    'common_dispatch': 'Dispatch',
    'common_payment': 'Payment',
    'common_vehicle': 'Vehicle',
    'common_booking': 'Booking',
    'common_farmer': 'Farmer',
    'common_fpo_admin': 'FPO Admin',
    'common_buyer': 'Buyer',
    'common_transporter': 'Transporter',
    'common_driver': 'Driver',
    
    'nav_dashboard': 'Dashboard',
    'nav_my_crops': 'My Crops',
    'nav_expenses': 'Expenses',
    'nav_mandi_prices': 'Mandi Prices',
    'nav_weather': 'Weather',
    'nav_find_fpo': 'Find FPO',
    'nav_my_produce': 'My Produce',
    'nav_payments': 'Payments',
    'nav_equipment': 'Equipment',
    'nav_transport': 'Transport',
    
    'nav_collection': 'Collection',
    'nav_weighing': 'Weighing',
    'nav_grading': 'Grading',
    'nav_aggregation': 'Aggregation',
    'nav_inventory': 'Inventory',
    'nav_ai_insights': 'AI Insights',
    'nav_buyers': 'Buyers',
    'nav_processing': 'Processing',
    'nav_dispatch': 'Dispatch',
    
    'nav_available_lots': 'Available Lots',
    'nav_my_orders': 'My Orders',
    'nav_track_shipments': 'Track Shipments',
    
    'nav_driver_portal': 'Driver Portal',

    'login_sign_in': 'Sign In',
    'login_subtitle': 'Enter your credentials to access your account',
    'login_phone_label': 'Phone Number',
    'login_password_label': 'Password',
    'login_authenticating': 'Authenticating...',
    'login_quick_demo': 'Quick Demo Logins',
    'login_dont_have_account': "Don't have an account?",
    'login_voice_login_title': 'Voice Login',
    'login_voice_login_hint': 'Say your phone number to login',
    
    'register_title': 'Register',
    'register_subtitle': 'Create a new account',
    'register_select_role': 'Select your role',
    'register_role_farmer': 'Farmer',
    'register_role_fpo': 'FPO Admin',
    'register_role_buyer': 'Buyer',
    'register_already_have_account': 'Already have an account?',
    'register_creating_account': 'Creating account...',

    'home_hero_title': 'Empowering Indian Agriculture',
    'home_hero_subtitle': 'Connecting farmers, FPOs, and buyers',
    'home_hero_description': 'A comprehensive platform for modern agriculture.',
    'home_enter_platform': 'Enter Platform',
    'home_case_study': 'Case Study',
    'home_download_dossier': 'Download Dossier',
    'home_voice_hint': 'Voice Hint',
    'home_metric_waste_title': 'Waste Reduction',
    'home_metric_income_title': 'Income Increase',
    'home_metric_spoilage_title': 'Spoilage Decrease',
    'home_metric_payment_title': 'Fast Payments',
    'home_standards_title': 'Standards',
    'home_consoles_title': 'Consoles',
    'home_consoles_subtitle': 'Access your specific console',
    'home_farmer_hub_title': 'Farmer Hub',
    'home_farmer_hub_desc': 'Manage crops and sales',
    'home_fpo_hub_title': 'FPO Hub',
    'home_fpo_hub_desc': 'Manage operations and buyers',
    'home_logistics_hub_title': 'Logistics Hub',
    'home_logistics_hub_desc': 'Manage transport and routes',
    'home_buyer_hub_title': 'Buyer Hub',
    'home_buyer_hub_desc': 'Purchase directly from FPOs',
    
    'farmer_dash_welcome': 'Welcome to Dashboard',
    'farmer_dash_join_fpo_title': 'Join an FPO',
    'farmer_dash_join_fpo_desc': 'Connect with an FPO for better prices',
    'farmer_dash_find_fpo': 'Find FPO',
    'farmer_dash_total_crops': 'Total Crops',
    'farmer_dash_active_lots': 'Active Lots',
    'farmer_dash_total_expenses': 'Total Expenses',
    'farmer_dash_pending_payments': 'Pending Payments',
    'farmer_dash_quick_actions': 'Quick Actions',
    'farmer_dash_log_crop': 'Log Crop',
    'farmer_dash_add_expense': 'Add Expense',
    'farmer_dash_view_prices': 'View Prices',
    'farmer_dash_recent_activity': 'Recent Activity'
}

langs = [
    'en', 'hi', 'mr', 'bn', 'te', 'ta', 'gu', 'kn', 'ml', 'pa', 
    'or', 'as', 'ur', 'mai', 'sat', 'ks', 'ne', 'kok', 'sd', 'doi', 'mni', 'brx', 'sa'
]

dir_path = r'C:\\Users\\abhij\\.gemini\\antigravity\\scratch\\CROP2GO\\client\\src\\data\\i18n'

# We'll just generate them with English texts and for major languages some translations 
hi_dict = {'common_save': 'सहेजें', 'common_cancel': 'रद्द करें', 'nav_dashboard': 'डैशबोर्ड'}

for lang in langs:
    with open(os.path.join(dir_path, f'{lang}.js'), 'w', encoding='utf-8') as f:
        f.write("export default {\\n")
        for k, v in keys.items():
            if lang == 'en':
                val = v
            elif lang == 'hi' and k in hi_dict:
                val = hi_dict[k]
            else:
                val = v
            val_escaped = val.replace("'", "\\\\'")
            f.write(f"  '{k}': '{val_escaped}',\\n")
        f.write("};\\n")

index_content = """import en from './en';
import hi from './hi';
import mr from './mr';
import bn from './bn';
import te from './te';
import ta from './ta';
import gu from './gu';
import kn from './kn';
import ml from './ml';
import pa from './pa';
import or_lang from './or';
import as_lang from './as';
import ur from './ur';
import mai from './mai';
import sat from './sat';
import ks from './ks';
import ne from './ne';
import kok from './kok';
import sd from './sd';
import doi from './doi';
import mni from './mni';
import brx from './brx';
import sa from './sa';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو' },
  { code: 'mai', name: 'Maithili', nativeName: 'मैथिली' },
  { code: 'sat', name: 'Santali', nativeName: 'ᱥᱟᱱᱛᱟᱲᱤ' },
  { code: 'ks', name: 'Kashmiri', nativeName: 'کٲشُر' },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली' },
  { code: 'kok', name: 'Konkani', nativeName: 'कोंकणी' },
  { code: 'sd', name: 'Sindhi', nativeName: 'سنڌي' },
  { code: 'doi', name: 'Dogri', nativeName: 'डोगरी' },
  { code: 'mni', name: 'Manipuri', nativeName: 'মৈতৈলোন্' },
  { code: 'brx', name: 'Bodo', nativeName: 'बड़ो' },
  { code: 'sa', name: 'Sanskrit', nativeName: 'संस्कृतम्' }
];

export const translations = {
  en, hi, mr, bn, te, ta, gu, kn, ml, pa, 
  or: or_lang, as: as_lang, ur, mai, sat, ks, ne, kok, sd, doi, mni, brx, sa
};

export const getTranslation = (lang, key, fallback = '') => {
  if (translations[lang] && translations[lang][key]) {
    return translations[lang][key];
  }
  if (translations['en'] && translations['en'][key]) {
    return translations['en'][key];
  }
  return fallback || key;
};
"""

with open(os.path.join(dir_path, 'index.js'), 'w', encoding='utf-8') as f:
    f.write(index_content)
