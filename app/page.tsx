"use client";

import Container from "../components/slices/Container/Container";
import TextSection from "../components/slices/TextSection/TextSection";
import Text from "../components/slices/Text/Text";
import Image from "../components/slices/Image/Image";
import Button from "../components/slices/Button/Button";
import { useTranslation } from "../hooks/useTranslation";
import { useNotificationStore } from "../stores";
import SubmitButton from "../components/slices/Button/SubmitButton";

export default function HomePage() {
  const { t } = useTranslation();
  const { addNotification } = useNotificationStore();

  const handleBrowseCars = () => {
    addNotification({
      type: "info",
      title: t("notifications.info"),
      message: t("homepage.notifications.browseCars"),
    });
  };

  const handleAddListing = () => {
    addNotification({
      type: "success",
      title: t("notifications.success"),
      message: t("homepage.notifications.addListing"),
    });
  };

  return (
    <main>
      {/* Hero Section */}
      <Container>
        <TextSection
          title={t("homepage.hero.title")}
          subtitle={t("homepage.hero.subtitle")}
          body={t("homepage.hero.description")}
          align="center"
          nostyle
        >
          <div>
            <Button variant="primary" size="lg" onClick={handleBrowseCars}>
              {t("nav.listings")}
            </Button>
            <Button variant="secondary" size="lg" onClick={handleAddListing}>
              {t("nav.sell")}
            </Button>
          </div>
        </TextSection>
      </Container>
      {/* Features Section */}
      <Container size="lg" padding>
        <div>
          <Text variant="h2">{t("homepage.features.title")}</Text>
        </div>

        <div>
          <TextSection
            title={t("homepage.features.easyToUse.title")}
            body={t("homepage.features.easyToUse.description")}
            // imageUrl="/feature-1.jpg"
            flex="column"
            align="center"
          />

          <TextSection
            title={t("homepage.features.safeSecure.title")}
            body={t("homepage.features.safeSecure.description")}
            // imageUrl="/feature-2.jpg"
            flex="column"
            align="center"
          />

          <TextSection
            title={t("homepage.features.bestPrices.title")}
            body={t("homepage.features.bestPrices.description")}
            // imageUrl="/feature-3.jpg"
            flex="column"
            align="center"
          />
        </div>
      </Container>

      <SubmitButton onClick={handleBrowseCars} variant="primary" type="submit">
        Save Changes
      </SubmitButton>
      {/* Image Gallery Section */}
      <Container size="full" padding>
        <div>
          <Text variant="h2">{t("homepage.featured.title")}</Text>
          <Text variant="paragraph">{t("homepage.featured.description")}</Text>
        </div>

        <div>
          <Image src="/car-1.jpg" alt="BMW X5" aspectRatio="3/2" />
          <Image src="/car-2.jpg" alt="Mercedes C-Class" aspectRatio="3/2" />
          <Image src="/car-3.jpg" alt="Audi A4" aspectRatio="3/2" />
          <Image src="/car-4.jpg" alt="Toyota Camry" aspectRatio="3/2" />
        </div>
      </Container>
    </main>
  );
}
