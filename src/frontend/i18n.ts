const translations: Record<string, Record<string, string>> = {
    en: {
        PONG: 'PONG',
        login: 'Login',
        username: 'Username',
        password: 'Password',
        email: 'Email',
    profile: 'Profile',
        single_player: 'Single Player',
        one_v_one: '1v1',
        one_v_one_online: '1V1 Online',
        tournament: 'Tournament',
        tournament_guest: 'Tournament (Guest)',
        friends: 'Friends',
        social: 'Social',
        logout: 'Logout',
        back_to_home: 'Back to Home',
        send: 'Send',
        pending_requests: 'Pending Requests',
        your_friends: 'Your Friends',
        see_blocked_users: 'See Blocked Users',
        waiting: 'Waiting',
        searching_players: 'Searching for players...',
        please_wait: 'Please wait while we find you a match',
        cancel: 'Cancel',
        forgot_password: 'Forgot your password?',
        sign_up_prompt: "Don't have an account? Sign Up",
    already_have_account_sign_in: 'Already have an account? Sign In',
        multiplayer: 'Multiplayer',
        search: 'Search',
        results: 'Results',
        view_profile: 'View Profile',
        add_friend: 'Add Friend',
        online: 'Online',
        offline: 'Offline',
        no_results: 'No results',
        go_to_chat: 'Go to Chat',
    fast_matches: 'Quick 1v1 online matches',
    one_v_one_local: '1V1 Local',
    same_machine: 'Play on the same machine',
    play_with_friends: 'Team up for 2v2 matches',
    bracket_elimination: 'Climb the bracket and be the champion',
        send_friend_request: 'Send Friend Request',
        enter_username: 'Enter username...',
        sign_up: 'Sign Up',
        reset_password: 'Reset Password',
        blocked_users: 'Blocked Users',
    unblock: 'Unblock',
    no_blocked_users: "You haven't blocked any users.",
    chat: 'Live Chat',
    back_to_login: 'Back to Login',
    friends_manage_help: 'Manage your friends and requests',
    search_user: 'Search User',
    no_chats_yet: 'No chats yet',
    find_user_above: 'Find a user with the search above',
    select_chat: 'Select a chat',
    type_message: 'Type your message...',
    user_blocked: 'You have blocked this user',
    user_profile: 'User Profile',
    two_fa_verification: '2FA Verification',
    enter_6_digit_code: 'Enter the 6-digit code sent to your email:',
    six_digit_code_placeholder: '6-digit code',
    verify: 'Verify',
    stats: 'Stats',
    win: 'Win',
    lose: 'Lose',
    username_label: 'Username:',
    email_label: 'Email:',
    change_username: 'Change Username',
    new_username_label: 'New Username:',
    enter_new_username: 'Enter new username',
    update_username: 'Update Username',
    change_password: 'Change Password',
    current_password_label: 'Current Password:',
    enter_current_password: 'Enter current password',
    new_password_label: 'New Password:',
    enter_new_password: 'Enter new password',
    confirm_new_password_label: 'Confirm New Password:',
    confirm_new_password: 'Confirm new password',
    update_password: 'Update Password',
    two_fa_title: 'Two-Factor Authentication (2FA)',
    two_fa_status_label: '2FA Status:',
    enabled: 'Enabled',
    disabled: 'Disabled',
    enable_2fa: 'Enable 2FA',
    disable_2fa: 'Disable 2FA',
    please_check_email_for_code: 'Please check your email for the 6-digit verification code.',
    enter_code_below: 'Enter the code below to enable 2FA.',
    verify_enable_2fa: 'Verify & Enable 2FA',
    confirm_disable_2fa: 'Are you sure you want to disable 2FA? This will make your account less secure.',
    disabling: 'Disabling...',
    setting_up: 'Setting up...',
    verification_code_sent: 'A verification code has been sent to your email. Please enter it below.',
    please_login_disable_2fa: 'Please login to disable 2FA',
    please_login_setup_2fa: 'Please login to setup 2FA',
    please_login_verify_2fa: 'Please login to verify 2FA',
    two_fa_disabled_success: '2FA disabled successfully!',
    two_fa_enabled_success: '2FA enabled successfully!',
    cancel_setup: 'Cancel Setup',
    enter_valid_6_digit_code: 'Please enter a valid 6-digit verification code',
    verification_code_must_be_6_digits: 'Verification code must be 6 digits',
    verifying: 'Verifying...',
    remove_friend: 'Remove Friend',
    block_user: 'Block',
    no_friends_yet: 'No friends yet',
    no_pending_requests: 'No pending requests',
    accept_request_success: 'Friend request accepted',
    reject_request_success: 'Friend request rejected',
    friend_request_sent_success: 'Friend request sent successfully',
    friend_request_failed: 'Failed to send friend request',
    confirm_remove_friend: 'Are you sure you want to remove this friend?',
    user_blocked_success: 'User blocked successfully',
    user_block_failed: 'Failed to block user',
    error_blocking_user: 'Error blocking user',
    please_enter_username: 'Please enter a username',
    updating: 'Updating...',
    file_size_limit_error: 'File size must be less than 5MB',
    avatar_changed_success: 'Avatar changed successfully!',
    password_fields_incomplete: 'Please fill in all password fields',
    password_mismatch: 'New passwords do not match',
    password_too_short: 'New password must be at least 6 characters long',
    password_same_as_old: 'New password must be different from current password',
    password_complexity_error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    password_update_success: 'Password updated successfully!',
    password_update_failed: 'Failed to update password',
    avatar_upload_failed: 'Failed to upload avatar',
    network_error_generic: 'Network error. Please try again.',
    current_password_incorrect: 'Current password is incorrect',
    two_fa_disable_failed: 'Failed to disable 2FA. Please try again.',
    two_fa_setup_failed: 'Failed to setup 2FA. Please try again.',
    username_empty_error: 'Please enter a new username.',
    username_same_error: 'New username must be different from the current one.',
    username_update_success: 'Username updated successfully!',
    username_update_failed: 'Failed to update username.',
    total_matches: 'Total Matches',
    win_rate: 'Win Rate',
    tournament_stats: 'Tournament Statistics',
    tournament_total: 'Total Tournaments',
    tournament_wins: 'Tournament Wins',
    tournament_losses: 'Tournament Losses',
    tournament_win_rate: 'Tournament Win Rate',
    match_history: 'Match History',
    match_history_loading: 'Loading match history...',
    match_history_empty: 'No match history yet',
    match_history_load_error: 'Failed to load match history',
    tournament_history: 'Tournament History',
    tournament_history_loading: 'Loading tournament history...',
    tournament_history_empty: 'No tournament history yet',
    tournament_history_load_error: 'Failed to load tournament history',
    champion_label: 'Champion:',
    unknown_user: 'Unknown User',
    winner_label: 'Winner:',
    search_username_placeholder: 'Search username...',
    search_button: 'Search',
    invalid_verification_code: 'Invalid verification code',
    friend_removed_success: 'Friend removed successfully',
    failed_to_remove_friend: 'Failed to remove friend',
    },
    tr: {
        PONG: 'PONG',
        login: 'Giriş',
        profile: 'Profil',
        username: 'Kullanıcı Adı',
        password: 'Şifre',
    email: 'E-posta',
        single_player: 'Tek Oyuncu',
        one_v_one: '1v1',
        one_v_one_online: '1V1 Online',
        tournament: 'Turnuva',
        tournament_guest: 'Turnuva (Misafir)',
        multiplayer: 'Çok Oyunculu',
        friends: 'Arkadaşlar',
        social: 'Sosyal',
        logout: 'Çıkış',
        back_to_home: 'Ana Sayfaya Dön',
        send: 'Gönder',
        pending_requests: 'Bekleyen İstekler',
        your_friends: 'Arkadaşların',
        see_blocked_users: 'Engellenenleri Gör',
        waiting: 'Bekleniyor',
        searching_players: 'Oyuncu aranıyor...',
        please_wait: 'Eşleşme bulunana kadar bekleyin',
        cancel: 'İptal',
        forgot_password: 'Şifreni mi unuttun?',
        sign_up_prompt: 'Hesabın yok mu? Kayıt Ol',
    search: 'Ara',
    results: 'Sonuçlar',
    add_friend: 'Arkadaş Ekle',
    online: 'Online',
    offline: 'Offline',
    no_results: 'Sonuç yok',
    go_to_chat: 'Sohbete Git',
    fast_matches: 'Hızlı 1v1 çevrimiçi maçlar',
    one_v_one_local: '1V1 Yerel',
    same_machine: 'Aynı cihazda oyna',
    play_with_friends: "2'ye 2 maçlar için takım ol",
    bracket_elimination: 'Eleme tablosunda ilerle, şampiyon ol',
        send_friend_request: 'Arkadaş İsteği Gönder',
        enter_username: 'Kullanıcı adını gir...',
        sign_up: 'Kayıt Ol',
        reset_password: 'Şifreyi Sıfırla',
        blocked_users: 'Bloklanan Kullanıcılar',
        unblock: 'Engeli Kaldır',
        no_blocked_users: 'Hiç blokladığın kullanıcı yok.',
        chat: 'Canlı Sohbet',
        back_to_login: 'Girişe Dön',
        friends_manage_help: 'Arkadaşlarını ve isteklerini yönet',
        search_user: 'Kullanıcı Ara',
        no_chats_yet: 'Henüz sohbet yok',
        find_user_above: 'Yukarıdaki arama ile kullanıcı bulun',
        select_chat: 'Bir sohbet seçin',
    type_message: 'Mesajını yaz...',
    user_blocked: 'Bu kullanıcıyı engelledin',
    user_profile: 'Kullanıcı Profili',
    two_fa_verification: '2FA Doğrulama',
    enter_6_digit_code: 'E-postanıza gönderilen 6 haneli kodu girin:',
    six_digit_code_placeholder: '6 haneli kod',
    verify: 'Doğrula',
    already_have_account_sign_in: 'Zaten hesabınız var mı? Giriş Yapın',
    stats: 'İstatistikler',
    win: 'Galibiyet',
    lose: 'Mağlubiyet',
    username_label: 'Kullanıcı Adı:',
    email_label: 'E-posta:',
    change_username: 'Kullanıcı Adını Değiştir',
    new_username_label: 'Yeni Kullanıcı Adı:',
    enter_new_username: 'Yeni kullanıcı adını gir',
    update_username: 'Kullanıcı Adını Güncelle',
    change_password: 'Şifreyi Değiştir',
    current_password_label: 'Mevcut Şifre:',
    enter_current_password: 'Mevcut şifreyi gir',
    new_password_label: 'Yeni Şifre:',
    enter_new_password: 'Yeni şifreyi gir',
    confirm_new_password_label: 'Yeni Şifreyi Onayla:',
    confirm_new_password: 'Yeni şifreyi onayla',
    update_password: 'Şifreyi Güncelle',
    two_fa_title: 'İki Aşamalı Doğrulama (2FA)',
    two_fa_status_label: '2FA Durumu:',
    enabled: 'Aktif',
    disabled: 'Pasif',
    enable_2fa: '2FA’yı Etkinleştir',
    disable_2fa: '2FA’yı Devre Dışı Bırak',
    please_check_email_for_code: '6 haneli doğrulama kodu için e-postanızı kontrol edin.',
    enter_code_below: '2FA’yı etkinleştirmek için aşağıya kodu girin.',
    verify_enable_2fa: 'Doğrula ve 2FA’yı Etkinleştir',
    confirm_disable_2fa: '2FA’yı devre dışı bırakmak istediğinize emin misiniz? Bu, hesabınızı daha az güvenli hale getirebilir.',
    disabling: 'Devre dışı bırakılıyor...',
    setting_up: 'Kurulum yapılıyor...',
    verification_code_sent: 'E-postanıza bir doğrulama kodu gönderildi. Lütfen aşağıya girin.',
    please_login_disable_2fa: '2FA’yı devre dışı bırakmak için lütfen giriş yapın',
    please_login_setup_2fa: '2FA kurulumunu başlatmak için lütfen giriş yapın',
    please_login_verify_2fa: '2FA’yı doğrulamak için lütfen giriş yapın',
    two_fa_disabled_success: '2FA başarıyla devre dışı bırakıldı!',
    two_fa_enabled_success: '2FA başarıyla etkinleştirildi!',
    cancel_setup: 'Kurulumu İptal Et',
    enter_valid_6_digit_code: 'Lütfen geçerli bir 6 haneli doğrulama kodu girin',
    verification_code_must_be_6_digits: 'Doğrulama kodu 6 haneli olmalıdır',
    verifying: 'Doğrulanıyor...',
    view_profile: 'Profili Gör',
    remove_friend: 'Arkadaşı Sil',
    block_user: 'Engelle',
    no_friends_yet: 'Henüz arkadaş yok',
    no_pending_requests: 'Bekleyen istek yok',
    accept_request_success: 'Arkadaş isteği kabul edildi',
    reject_request_success: 'Arkadaş isteği reddedildi',
    friend_request_sent_success: 'Arkadaş isteği başarıyla gönderildi',
    friend_request_failed: 'Arkadaş isteği gönderilemedi',
    confirm_remove_friend: 'Bu arkadaşı silmek istediğine emin misin?',
    user_blocked_success: 'Kullanıcı başarıyla engellendi',
    user_block_failed: 'Kullanıcı engellenemedi',
    error_blocking_user: 'Kullanıcı engellenirken hata oluştu',
    please_enter_username: 'Lütfen bir kullanıcı adı girin',
    updating: 'Güncelleniyor...',
    file_size_limit_error: 'Dosya boyutu 5MB\'den küçük olmalı',
    avatar_changed_success: 'Avatar başarıyla değiştirildi!',
    password_fields_incomplete: 'Lütfen tüm şifre alanlarını doldurun',
    password_mismatch: 'Yeni şifreler eşleşmiyor',
    password_too_short: 'Yeni şifre en az 6 karakter olmalı',
    password_same_as_old: 'Yeni şifre önceki şifreyle aynı olmamalı',
    password_complexity_error: 'Şifre en az bir büyük harf, bir küçük harf ve bir rakam içermeli',
    password_update_success: 'Şifre başarıyla güncellendi!',
    password_update_failed: 'Şifre güncellenemedi',
    avatar_upload_failed: 'Avatar yüklenemedi',
    network_error_generic: 'Ağ hatası. Lütfen tekrar deneyin.',
    current_password_incorrect: 'Mevcut şifre yanlış',
    two_fa_disable_failed: '2FA devre dışı bırakılamadı. Lütfen tekrar deneyin.',
    two_fa_setup_failed: '2FA kurulumu yapılamadı. Lütfen tekrar deneyin.',
    username_empty_error: 'Lütfen yeni bir kullanıcı adı girin.',
    username_same_error: 'Yeni kullanıcı adı mevcut olanla aynı olmamalı.',
    username_update_success: 'Kullanıcı adı başarıyla güncellendi!',
    username_update_failed: 'Kullanıcı adı güncellenemedi.',
    total_matches: 'Toplam Maç',
    win_rate: 'Kazanma Oranı',
    tournament_stats: 'Turnuva İstatistikleri',
    tournament_total: 'Toplam Turnuva',
    tournament_wins: 'Turnuva Kazanma',
    tournament_losses: 'Turnuva Kaybetme',
    tournament_win_rate: 'Turnuva Kazanma Oranı',
    match_history: 'Maç Geçmişi',
    match_history_loading: 'Maç geçmişi yükleniyor...',
    match_history_empty: 'Henüz maç geçmişi yok',
    match_history_load_error: 'Maç geçmişi yüklenemedi',
    tournament_history: 'Turnuva Geçmişi',
    tournament_history_loading: 'Turnuva geçmişi yükleniyor...',
    tournament_history_empty: 'Henüz turnuva geçmişi yok',
    tournament_history_load_error: 'Turnuva geçmişi yüklenemedi',
    champion_label: 'Şampiyon:',
    unknown_user: 'Bilinmeyen Kullanıcı',
    winner_label: 'Kazanan:',
    search_username_placeholder: 'Kullanıcı adı ara...',
    search_button: 'Ara',
    invalid_verification_code: 'Geçersiz doğrulama kodu',
    friend_removed_success: 'Arkadaş silindi',
    failed_to_remove_friend: 'Arkadaş silinemedi',
    }
}

function getLanguage(): string {
    return localStorage.getItem('lang') || 'en';
}

function setLanguage(lang: string) {
    localStorage.setItem('lang', lang);
    translateDOM();
}

function t(key: string): string {
    const lang = getLanguage();
    return translations[lang]?.[key] || translations['en'][key] || key;
}

function translateDOM(root: HTMLElement | Document = document) {
    const lang = getLanguage();
    const elements = (root as Document).querySelectorAll?.('[data-i18n]');
    if (elements) {
        elements.forEach((el) => {
            const key = el.getAttribute('data-i18n') || '';
            const text = translations[lang]?.[key] || translations['en'][key] || key;
            if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
                el.value = text;
            } else {
                el.textContent = text;
            }
        });
    }

    const placeholders = (root as Document).querySelectorAll?.('[data-i18n-placeholder]');
    if (placeholders) {
        placeholders.forEach((el) => {
            const key = el.getAttribute('data-i18n-placeholder') || '';
            const text = translations[lang]?.[key] || translations['en'][key] || key;
            if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
                el.placeholder = text;
            } else {
                el.setAttribute('placeholder', text);
            }
        });
    }
    const enBtn = document.getElementById('lang-en') as HTMLElement | null;
    const trBtn = document.getElementById('lang-tr') as HTMLElement | null;
    if (enBtn && trBtn) {
        const activeStyle = '0 0 14px var(--neon-cyan), 0 0 24px rgba(0,240,255,0.5)';
        const inactiveStyle = 'none';
        if (lang === 'tr') {
            enBtn.classList.remove('font-bold');
            trBtn.classList.add('font-bold');
            enBtn.style.opacity = '0.6';
            trBtn.style.opacity = '1';
            (trBtn.style as any).boxShadow = activeStyle;
            (enBtn.style as any).boxShadow = inactiveStyle;
        } else {
            trBtn.classList.remove('font-bold');
            enBtn.classList.add('font-bold');
            trBtn.style.opacity = '0.6';
            enBtn.style.opacity = '1';
            (enBtn.style as any).boxShadow = activeStyle;
            (trBtn.style as any).boxShadow = inactiveStyle;
        }
    }
}

function setupLanguageButtons() {
    document.addEventListener('click', (e) => {
        const target = e.target as HTMLElement | null;
        if (!target) return;
        if (target.id === 'lang-en') {
            setLanguage('en');
        }
        if (target.id === 'lang-tr') {
            setLanguage('tr');
        }
    });
}

(window as any).i18n = {
    t,
    setLanguage,
    getLanguage,
    translateDOM,
    setupLanguageButtons,
}

window.addEventListener('load', () => {
    setupLanguageButtons();
    translateDOM();
});

export { t, setLanguage, getLanguage, translateDOM, setupLanguageButtons };


