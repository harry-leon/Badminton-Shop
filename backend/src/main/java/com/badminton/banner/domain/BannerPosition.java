package com.badminton.banner.domain;

public final class BannerPosition {
    public static final String HERO = "HERO";
    public static final String HERO_SLIDER = "HERO_SLIDER";
    public static final String PROMO_POPUP = "PROMO_POPUP";
    public static final String MID_PAGE = "MID_PAGE";
    public static final String HOME_PROMO_3 = "HOME_PROMO_3";
    public static final String HOME_MAIN = "HOME_MAIN";
    public static final String USP_BAR = "USP_BAR";

    private BannerPosition() {}

    public static boolean isValid(String position) {
        if (position == null) return false;
        return switch (position.toUpperCase()) {
            case HERO, HERO_SLIDER, PROMO_POPUP, MID_PAGE, HOME_PROMO_3, HOME_MAIN, USP_BAR -> true;
            default -> false;
        };
    }
}
