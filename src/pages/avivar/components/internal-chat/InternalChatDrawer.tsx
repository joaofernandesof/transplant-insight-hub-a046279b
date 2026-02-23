/**
 * InternalChatDrawer - Drawer lateral com lista de chats e thread ativa
 */
import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ChatList } from './ChatList';
import { ChatThread } from './ChatThread';
import { NewChatDialog } from './NewChatDialog';
import { useInternalChat } from '@/hooks/useInternalChat';

interface InternalChatDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InternalChatDrawer({ open, onOpenChange }: InternalChatDrawerProps) {
  const chat = useInternalChat();
  const [showNewChat, setShowNewChat] = useState(false);

  const handleBack = () => {
    chat.closeChat();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[420px] p-0 flex flex-col gap-0">
        {chat.activeChatId && chat.activeChat ? (
          <ChatThread
            chat={chat.activeChat}
            messages={chat.messages}
            isLoading={chat.isLoadingMessages}
            onBack={handleBack}
            onSendMessage={async (content, mentions, replyTo) => {
              await chat.sendMessage({
                chatId: chat.activeChatId!,
                content,
                mentions,
                replyTo,
              });
            }}
            onSendFile={async (file) => {
              const uploaded = await chat.uploadFile(file, chat.activeChatId!);
              if (uploaded) {
                const isImage = file.type.startsWith('image/');
                await chat.sendMessage({
                  chatId: chat.activeChatId!,
                  content: uploaded.name,
                  messageType: isImage ? 'image' : 'file',
                  fileUrl: uploaded.url,
                  fileName: uploaded.name,
                  fileSize: uploaded.size,
                });
              }
            }}
            getChatDisplayName={chat.getChatDisplayName}
            getChatAvatar={chat.getChatAvatar}
            teamMembers={chat.teamMembers}
          />
        ) : (
          <>
            <SheetHeader className="p-4 border-b">
              <SheetTitle className="flex items-center justify-between">
                <span>Chat Interno</span>
              </SheetTitle>
            </SheetHeader>
            <ChatList
              chats={chat.chats}
              isLoading={chat.isLoading}
              onSelectChat={chat.openChat}
              onNewChat={() => setShowNewChat(true)}
              getChatDisplayName={chat.getChatDisplayName}
              getChatAvatar={chat.getChatAvatar}
            />
          </>
        )}

        <NewChatDialog
          open={showNewChat}
          onOpenChange={setShowNewChat}
          teamMembers={chat.teamMembers}
          onCreateChat={async (type, memberIds, name) => {
            const chatId = await chat.createChat({ type, memberIds, name });
            if (chatId) {
              chat.openChat(chatId);
              setShowNewChat(false);
            }
          }}
        />
      </SheetContent>
    </Sheet>
  );
}
