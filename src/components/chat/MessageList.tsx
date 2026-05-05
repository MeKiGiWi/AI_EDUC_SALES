import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import type { ScenarioMessage } from "../../types/academy";
import { ChatBubble } from "../simulator/ChatBubble";

interface MessageListProps {
  messages: ScenarioMessage[];
}

export function MessageList({ messages }: MessageListProps) {
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.messageColumn}>
        {messages.map((message) => (
          <ChatBubble key={message.id} message={message} />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    minHeight: 0
  },
  content: {
    flexGrow: 1,
    justifyContent: "flex-end",
    paddingVertical: 16
  },
  messageColumn: {
    width: "100%",
    maxWidth: 780,
    alignSelf: "center",
    gap: 10
  }
});
