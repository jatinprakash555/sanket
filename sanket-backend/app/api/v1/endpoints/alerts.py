import os
import logging
from fastapi import APIRouter, HTTPException
from app.schemas.contracts import VoiceAlertRequest, VoiceAlertResponse, SMSAlertRequest, SMSAlertResponse
from app.core.database import db
from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()

# Ensure audio directory exists
os.makedirs(settings.AUDIO_DIR, exist_ok=True)

# Multilingual localized voice alert templates
ALERT_SCRIPTS = {
    "odia": {
        "CRITICAL": "ସତର୍କ ସୂଚନା! {district_name} ଜିଲ୍ଲାରେ ଭୀଷଣ ଗ୍ରୀଷ୍ମ ପ୍ରବାହ ଏବଂ ଜଳକଷ୍ଟ ଜନିତ ଜ୍ୱର ମାମଲା ଦ୍ରୁତ ଗତିରେ ବୃଦ୍ଧି ପାଉଛି। ତୁରନ୍ତ ସମସ୍ତ ପ୍ରାଥମିକ ସ୍ୱାସ୍ଥ୍ୟ କେନ୍ଦ୍ରକୁ ଓଆରଏସ୍ ଏବଂ ସାଲାଇନ୍ ପଠାନ୍ତୁ। ଦିନ ୧୧ଟାରୁ ଅପରାହ୍ନ ୩ଟା ପର୍ଯ୍ୟନ୍ତ ଶ୍ରମିକ କାର୍ଯ୍ୟ ବନ୍ଦ ରଖନ୍ତୁ।",
        "HIGH": "ଧ୍ୟାନ ଦିଅନ୍ତୁ! {district_name} ଜିଲ୍ଲାରେ ତାପମାତ୍ରା ୪୨ ଡିଗ୍ରୀ ଉପରେ ରହିଛି ଏବଂ ଆଶା କର୍ମୀଙ୍କ ତରଫରୁ ଅଂଶୁଘାତ ରିପୋର୍ଟ ଆସିଛି। ପାନୀୟ ଜଳ ବ୍ୟବସ୍ଥା ଏବଂ କୁଲିଂ ସେଲଟର କାର୍ଯ୍ୟକ୍ଷମ କରନ୍ତୁ।",
        "MODERATE": "{district_name} ଜିଲ୍ଲାରେ ଗ୍ରୀଷ୍ମ ଋତୁ ଜନିତ ସତର୍କତା ବଜାୟ ରଖନ୍ତୁ ଏବଂ ସ୍ୱାସ୍ଥ୍ୟ ସ୍ଥିତି ଉପରେ ନଜର ରଖନ୍ତୁ।",
        "LOW": "{district_name} ଜିଲ୍ଲାରେ ପାଣିପାଗ ଏବଂ ସ୍ୱାସ୍ଥ୍ୟ ସ୍ଥିତି ସ୍ୱାଭାବିକ ରହିଛି।"
    },
    "hindi": {
        "CRITICAL": "आपातकालीन चेतावनी! {district_name} जिले में भीषण लू और निर्जलीकरण के मामलों में भारी उछाल दर्ज किया गया है। सभी प्राथमिक स्वास्थ्य केंद्रों पर तुरंत ओआरएस एवं आईवी ड्रिप उपलब्ध कराएं। दोपहर 11 से 3 बजे तक धूप में मजदूरी पर रोक लगाएं।",
        "HIGH": "सावधान! {district_name} जिले में तापमान 42 डिग्री से अधिक है और जमीनी स्तर पर बुखार के मामले बढ़ रहे हैं। स्थानीय जल सेवा और शीतलन केंद्र सक्रिय करें।",
        "MODERATE": "{district_name} जिले में सामान्य ग्रीष्मकालीन सतर्कता बनाए रखें और दैनिक स्वास्थ्य रिपोर्ट पर निगरानी रखें।",
        "LOW": "{district_name} जिले में स्वास्थ्य एवं मौसमी जोखिम सामान्य सीमा में है।"
    },
    "english": {
        "CRITICAL": "Urgent Health Advisory! District {district_name} has triggered a Critical Red Alert with severe heatwave conditions exceeding 42°C and clustering dehydration cases. Immediate dispatch of ORS and IV fluids to rural Primary Health Centres is mandated.",
        "HIGH": "Priority Alert: District {district_name} heat risk score is High. Frontline surveillance shows increased fever cases. Activate shaded cooling kiosks and emergency hydration points.",
        "MODERATE": "Advisory: District {district_name} is under moderate thermal surveillance. Ensure routine hydration protocols.",
        "LOW": "District {district_name} status is normal. Routine seasonal surveillance active."
    }
}

PHONETIC_GUIDES = {
    "odia": "Satarka Soochana! {district_name} jillare bheeshana greeshma prabaha abang jalakashta janita jwara mamala druta gatire brudhi pauchi. Turanta ORS abang saline pathantu.",
    "hindi": "Aapatkaleen Chetavani! {district_name} jile mein bheeshan loo aur nirjalikaran ke maamlon mein bhaari uchhal darj kiya gaya hai. Turant ORS aur cooling kendra sakriya karein.",
    "english": "Urgent Health Advisory for {district_name}. High thermal stress detected with syndromic ground cases. Mobilize emergency ORS supplies immediately."
}

@router.post("/voice", response_model=VoiceAlertResponse)
async def generate_voice_alert(payload: VoiceAlertRequest):
    """
    Generate localized voice advisory in Odia, Hindi, or English
    using TTS and prepare audio playback for administrative dispatch.
    """
    district = db.get_district(payload.district_id)
    if not district:
        raise HTTPException(status_code=404, detail=f"District '{payload.district_id}' not found")

    d_name = district["name"]
    risk_level = district.get("risk_level", "HIGH")
    lang = payload.language.lower()
    if lang not in ALERT_SCRIPTS:
        lang = "english"

    script = ALERT_SCRIPTS[lang].get(risk_level, ALERT_SCRIPTS[lang]["HIGH"]).format(district_name=d_name)
    phonetic = PHONETIC_GUIDES.get(lang, PHONETIC_GUIDES["english"]).format(district_name=d_name)

    audio_filename = f"alert_{payload.district_id.lower()}_{lang}.mp3"
    audio_path = os.path.join(settings.AUDIO_DIR, audio_filename)
    audio_url = f"/static/audio/{audio_filename}"

    # Try generating actual TTS file with gTTS
    try:
        from gtts import gTTS
        # gTTS supports 'hi' for Hindi, 'en' for English; for Odia we can generate Hindi or English pronunciation as fallback
        tts_lang = "hi" if lang in ["odia", "hindi"] else "en"
        tts_text = script if lang in ["hindi", "english"] else phonetic
        tts = gTTS(text=tts_text, lang=tts_lang, slow=False)
        tts.save(audio_path)
    except Exception as e:
        logger.warning(f"gTTS audio generation skipped: {e}")
        audio_url = None

    # Log dispatch
    db.log_alert({
        "district_id": payload.district_id,
        "district_name": d_name,
        "type": "VOICE",
        "language": lang,
        "recipient_role": payload.recipient_role,
        "transcript": script
    })

    return VoiceAlertResponse(
        district_id=payload.district_id,
        district_name=d_name,
        language=lang,
        recipient_role=payload.recipient_role,
        audio_url=audio_url,
        transcript=script,
        phonetic_preview=phonetic,
        status="dispatched"
    )

@router.post("/sms", response_model=SMSAlertResponse)
async def trigger_sms_alert(payload: SMSAlertRequest):
    """
    Simulate automated SMS alert dispatch via Twilio / C-DAC Gateway
    to the designated Block or District officer.
    """
    district = db.get_district(payload.district_id)
    if not district:
        raise HTTPException(status_code=404, detail=f"District '{payload.district_id}' not found")

    d_name = district["name"]
    score = district.get("calculated_score", 75.0)
    level = district.get("risk_level", "HIGH")
    
    msg_preview = (
        f"[SANKET ALERT] {level} PRIORITY for {d_name} (Risk Score: {score}/100). "
        f"Heat index exceeding safety margins with frontline fever clusters. "
        f"Role: {payload.recipient_role}. Deploy PHC ORS kits immediately."
    )

    db.log_alert({
        "district_id": payload.district_id,
        "district_name": d_name,
        "type": "SMS",
        "phone": payload.recipient_phone,
        "recipient_role": payload.recipient_role,
        "message": msg_preview
    })

    return SMSAlertResponse(
        success=True,
        recipient_phone=payload.recipient_phone,
        preview_message=msg_preview,
        status="DELIVERED_MOCK_GATEWAY",
        dispatched_at="Just now"
    )

@router.get("/recent")
async def get_recent_alerts(limit: int = 15):
    """
    Fetch recent alert logs.
    """
    return db.get_alerts(limit=limit)
