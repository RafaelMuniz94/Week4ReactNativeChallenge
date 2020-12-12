import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useLayoutEffect,
} from "react";
import { Image } from "react-native";

import Icon from "react-native-vector-icons/Feather";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";
import { useNavigation, useRoute } from "@react-navigation/native";
import formatValue from "../../utils/formatValue";

import api from "../../services/api";

import {
  Container,
  Header,
  ScrollContainer,
  FoodsContainer,
  Food,
  FoodImageContainer,
  FoodContent,
  FoodTitle,
  FoodDescription,
  FoodPricing,
  AdditionalsContainer,
  Title,
  TotalContainer,
  AdittionalItem,
  AdittionalItemText,
  AdittionalQuantity,
  PriceButtonContainer,
  TotalPrice,
  QuantityContainer,
  FinishOrderButton,
  ButtonText,
  IconContainer,
} from "./styles";

interface Params {
  id: number;
}

interface Extra {
  id: number;
  name: string;
  value: number;
  quantity: number;
}

interface Food {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  formattedPrice: string;
  extras: Extra[];
}

const FoodDetails: React.FC = () => {
  const [food, setFood] = useState({} as Food);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [foodQuantity, setFoodQuantity] = useState(1);

  const navigation = useNavigation();
  const route = useRoute();

  const routeParams = route.params as Params;

  useEffect(() => {
    let { id } = routeParams;
    async function loadFavorite(): Promise<void> {
      try {
        let isFavorited = await api.get<Food>(`/favorites/${id}`);
        setIsFavorite(!!isFavorited);
      } catch {
        setIsFavorite(false);
      }
    }
    loadFavorite();
  }, [routeParams]);

  useEffect(() => {
    async function loadFood(): Promise<void> {
      // Load a specific food with extras based on routeParams id
      let { id } = routeParams;
      let response = await api.get<Food>(`/foods/${id}`);

      let formattedFoods = {
        ...response.data,
        formattedPrice: formatValue(response.data.price),
      };

      let formattedExtras = response.data.extras.map((extra) => {
        return {
          ...extra,
          quantity: 0,
        };
      });

      setFood(formattedFoods);
      setExtras(formattedExtras);
    }

    loadFood();
  }, [routeParams]);

  function handleIncrementExtra(id: number): void {
    // Increment extra quantity

    setExtras(
      extras.map((extra) =>
        extra.id === id ? { ...extra, quantity: extra.quantity + 1 } : extra
      )
    );
  }

  function handleDecrementExtra(id: number): void {
    // Decrement extra quantity

    setExtras(
      extras.map((extra) =>
        extra.id === id
          ? { ...extra, quantity: extra.quantity == 0 ? 0 : extra.quantity - 1 }
          : extra
      )
    );
  }

  function handleIncrementFood(): void {
    // Increment food quantity
    let value = foodQuantity + 1;
    setFoodQuantity(value);
  }

  function handleDecrementFood(): void {
    // Decrement food quantity

    let value = foodQuantity == 1 ? 1 : foodQuantity - 1;
    setFoodQuantity(value);
  }

  const toggleFavorite = useCallback(() => {
    // Toggle if food is favorite or not
    try {
      if (!isFavorite) {
        api.post("/favorites", food).then(() => {
          setIsFavorite(true);
        });
      } else {
        api.delete(`/favorites/${food.id}`).then(() => {
          setIsFavorite(false);
        });
      }
    } catch (Error) {
      console.log(`Error: ${Error}`);
    }
  }, [isFavorite, food]);

  const cartTotal = useMemo(() => {
    // Calculate cartTotal
    let value = 0;
    value = foodQuantity * food.price;
    value =
      value +
      extras.reduce((previousValue, current) => {
        let totalCurrent = current.quantity * current.value;
        return previousValue + totalCurrent;
      }, 0);
    return formatValue(value);
  }, [extras, food, foodQuantity]);

  async function handleFinishOrder(): Promise<void> {
    // Finish the order and save on the API
    try{
      let orderedFood = food;
      orderedFood.extras = extras

      await api.post("/orders",orderedFood)
      
      navigation.navigate('Dashboard')
      
    }catch(Error){
      console.log(`Error:${Error}`)
    }
  }

  // Calculate the correct icon name
  const favoriteIconName = useMemo(
    () => (isFavorite ? "favorite" : "favorite-border"),
    [isFavorite]
  );

  useLayoutEffect(() => {
    // Add the favorite icon on the right of the header bar
    navigation.setOptions({
      headerRight: () => (
        <MaterialIcon
          name={favoriteIconName}
          size={24}
          color="#FFB84D"
          onPress={() => toggleFavorite()}
        />
      ),
    });
  }, [navigation, favoriteIconName, toggleFavorite]);

  return (
    <Container>
      <Header />

      <ScrollContainer>
        <FoodsContainer>
          <Food>
            <FoodImageContainer>
              <Image
                style={{ width: 327, height: 183 }}
                source={{
                  uri: food.image_url,
                }}
              />
            </FoodImageContainer>
            <FoodContent>
              <FoodTitle>{food.name}</FoodTitle>
              <FoodDescription>{food.description}</FoodDescription>
              <FoodPricing>{food.formattedPrice}</FoodPricing>
            </FoodContent>
          </Food>
        </FoodsContainer>
        <AdditionalsContainer>
          <Title>Adicionais</Title>
          {extras.map((extra) => (
            <AdittionalItem key={extra.id}>
              <AdittionalItemText>{extra.name}</AdittionalItemText>
              <AdittionalQuantity>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="minus"
                  onPress={() => handleDecrementExtra(extra.id)}
                  testID={`decrement-extra-${extra.id}`}
                />
                <AdittionalItemText testID={`extra-quantity-${extra.id}`}>
                  {extra.quantity}
                </AdittionalItemText>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="plus"
                  onPress={() => handleIncrementExtra(extra.id)}
                  testID={`increment-extra-${extra.id}`}
                />
              </AdittionalQuantity>
            </AdittionalItem>
          ))}
        </AdditionalsContainer>
        <TotalContainer>
          <Title>Total do pedido</Title>
          <PriceButtonContainer>
            <TotalPrice testID="cart-total">{cartTotal}</TotalPrice>
            <QuantityContainer>
              <Icon
                size={15}
                color="#6C6C80"
                name="minus"
                onPress={handleDecrementFood}
                testID="decrement-food"
              />
              <AdittionalItemText testID="food-quantity">
                {foodQuantity}
              </AdittionalItemText>
              <Icon
                size={15}
                color="#6C6C80"
                name="plus"
                onPress={handleIncrementFood}
                testID="increment-food"
              />
            </QuantityContainer>
          </PriceButtonContainer>

          <FinishOrderButton onPress={() => handleFinishOrder()}>
            <ButtonText>Confirmar pedido</ButtonText>
            <IconContainer>
              <Icon name="check-square" size={24} color="#fff" />
            </IconContainer>
          </FinishOrderButton>
        </TotalContainer>
      </ScrollContainer>
    </Container>
  );
};

export default FoodDetails;
