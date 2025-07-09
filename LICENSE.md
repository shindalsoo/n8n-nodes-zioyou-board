# 개요 및 사용설명
# Gemini 음성 대화 어시스턴트

이 프로젝트는 Gemini CLI와 음성을 통해 상호작용할 수 있도록 돕는 파이썬 스크립트입니다. 사용자의 음성 질문을 텍스트로 변환하여 Gemini CLI에 전달하고, Gemini CLI의 텍스트 응답을 다시 음성으로 변환하여 사용자에게 들려줍니다. 지속적인 대화가 가능하도록 구현되었습니다.

## 1. 프로젝트 개요

이 스크립트는 **STT (Speech-to-Text)** 기능을 이용해 사용자의 음성 질문을 텍스트로 변환하고, 이 텍스트를 **Gemini CLI**로 전달합니다. Gemini CLI의 텍스트 응답은 다시 **TTS (Text-to-Speech)** 기능을 통해 음성으로 변환되어 사용자에게 들려집니다. `subprocess`와 `threading` 모듈을 활용하여 Gemini CLI 프로세스와 파이썬 스크립트가 병렬적으로 작동하도록 구현했습니다.

## 2. 주요 기능

* **음성 질문**: 마이크를 통해 Gemini에게 음성으로 질문할 수 있습니다.
* **음성 응답**: Gemini의 텍스트 응답을 음성으로 들을 수 있습니다.
* **지속적인 대화**: "종료" 또는 "exit"라고 말하기 전까지 계속해서 대화를 이어갈 수 있습니다.
* **백그라운드 처리**: 음성 인식과 재생이 별도의 스레드에서 처리되어 원활한 사용자 경험을 제공합니다.

## 3. 환경 설정 및 설치

본 스크립트는 Ubuntu Desktop 24.04 환경에서 테스트되었습니다.

### 3.1. Gemini CLI 설치

Node.js와 npm이 설치되어 있어야 합니다.

```bash
npm install -g @google/gemini-cli gemini
```
### 3.2. 파이썬 라이브러리 설치
```bash
pip install SpeechRecognition PyAudio gTTS playsound
PyAudio 설치시 오류 발생한다면 아래 명령어 실행
sudo apt-get install portaudio19-dev python3-pyaudio
```

### 4. 소스코드 (continuus_gemini_audio.py)
```python
import speech_recognition as sr
import subprocess
import shlex
from gtts import gTTS
from playsound import playsound
import os
import threading
import queue
import sys
import time

# 음성 인식 및 재생 관련 설정
RECOGNIZER = sr.Recognizer()
AUDIO_QUEUE = queue.Queue() # Gemini CLI 출력을 저장할 큐

# --- STT (Speech-to-Text) 함수 ---
def speech_to_text_from_mic():
    """마이크 입력을 받아 텍스트로 변환합니다."""
    with sr.Microphone() as source:
        print("\n[말씀해주세요... (종료하려면 '종료' 또는 'exit'라고 말하세요)]")
        try:
            # 주변 소음 수준을 조절하여 더 정확한 인식을 돕습니다.
            RECOGNIZER.adjust_for_ambient_noise(source)
            audio = RECOGNIZER.listen(source, timeout=5, phrase_time_limit=10)
            print("[음성 인식 중...]")
            text = RECOGNIZER.recognize_google(audio, language="ko-KR") # 한국어 설정
            print(f"[인식된 텍스트: {text}]")
            return text
        except sr.UnknownValueError:
            print("[음성을 인식할 수 없습니다. 다시 시도해주세요.]")
            return None
        except sr.RequestError as e:
            print(f"[Google Web Speech API 서비스에서 에러 발생: {e}]")
            return None
        except sr.WaitTimeoutError:
            print("[음성 입력이 없습니다. 다시 시도해주세요.]")
            return None

# --- TTS (Text-to-Speech) 함수 ---
def play_text_as_audio(text_to_speak):
    """텍스트를 음성으로 변환하여 재생합니다."""
    if not text_to_speak.strip():
        return

    print("[Gemini 응답을 음성으로 재생합니다...]")
    try:
        tts = gTTS(text=text_to_speak, lang='ko') # 한국어 음성 생성
        tts_file = "gemini_response_temp.mp3"
        tts.save(tts_file)
        playsound(tts_file)
        os.remove(tts_file) # 재생 후 파일 삭제
    except Exception as e:
        print(f"[TTS 생성 또는 재생 중 오류 발생: {e}]")

# --- Gemini CLI 출력 리더 스레드 ---
def read_gemini_output(stdout_pipe):
    """Gemini CLI의 출력을 읽어 큐에 넣고, TTS로 재생합니다."""
    current_response_buffer = []
    while True:
        line = stdout_pipe.readline()
        if not line: # EOF (End of File)
            break
        
        stripped_line = line.strip()
        print(f"Gemini CLI: {stripped_line}") # 터미널에도 출력
        current_response_buffer.append(stripped_line)

        # Gemini CLI의 응답 끝 감지 로직 (Gemini의 프롬프트 "gemini >"를 기준으로 판단)
        if "gemini >" in stripped_line:
            # 마지막 프롬프트 라인을 제외하고 이전까지의 내용을 하나의 응답으로 합칩니다.
            full_response = " ".join(current_response_buffer[:-1]).strip()
            if full_response:
                AUDIO_QUEUE.put(full_response)
            current_response_buffer = [] # 버퍼 초기화
            print("\n[다음 질문을 기다립니다...]") # 다음 입력을 기다릴 준비가 되었음을 알림


    # 스레드 종료 전 마지막 버퍼 처리 (만약 남아있다면)
    if current_response_buffer:
        full_response = " ".join(current_response_buffer).strip()
        if full_response:
            AUDIO_QUEUE.put(full_response)

# --- 메인 실행 로직 ---
def main():
    # Gemini CLI 프로세스 시작 (한 번만)
    command = "gemini" # Gemini CLI가 설치된 경로에 따라 다를 수 있습니다.
    print(f"[{command} CLI 시작 중...]")
    try:
        gemini_process = subprocess.Popen(
            shlex.split(command),
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding='utf-8',
            bufsize=1 # 버퍼링을 최소화하여 실시간 출력에 가깝게
        )
        print("[Gemini CLI가 시작되었습니다. 초기 프롬프트가 나타날 때까지 기다리세요.]")
        # 초기 프롬프트가 나타날 때까지 잠시 대기 (필요에 따라 조절)
        time.sleep(2) 

    except FileNotFoundError:
        print(f"오류: '{command}' 명령을 찾을 수 없습니다. Gemini CLI가 제대로 설치되었거나 PATH에 추가되었는지 확인하세요.")
        return
    except Exception as e:
        print(f"Gemini CLI 시작 중 오류 발생: {e}")
        return

    # Gemini CLI 출력을 읽을 별도의 스레드 시작
    output_reader_thread = threading.Thread(target=read_gemini_output, args=(gemini_process.stdout,))
    output_reader_thread.daemon = True # 메인 스레드 종료 시 함께 종료
    output_reader_thread.start()

    # TTS 재생 스레드 (큐에서 응답을 가져와 재생)
    def audio_player_thread():
        while True:
            response_text = AUDIO_QUEUE.get()
            play_text_as_audio(response_text)
            AUDIO_QUEUE.task_done()

    player_thread = threading.Thread(target=audio_player_thread)
    player_thread.daemon = True
    player_thread.start()

    # 메인 루프: 음성 입력 -> Gemini CLI로 전달
    try:
        while True:
            user_input_text = speech_to_text_from_mic()
            
            if user_input_text:
                if user_input_text.lower() in ["종료", "exit"]:
                    print("[대화를 종료합니다.]")
                    break
                
                # Gemini CLI에 사용자 입력 전달
                try:
                    gemini_process.stdin.write(user_input_text + "\n")
                    gemini_process.stdin.flush()
                except BrokenPipeError:
                    print("[Gemini CLI 프로세스가 종료되었습니다. 프로그램을 재시작하세요.]")
                    break
                except Exception as e:
                    print(f"[Gemini CLI 입력 중 오류 발생: {e}]")
                    break

            # 짧은 지연 (CPU 사용량 줄이기)
            time.sleep(0.1)

    except KeyboardInterrupt:
        print("\n[Ctrl+C가 감지되었습니다. 대화를 종료합니다.]")
    finally:
        # 프로세스 종료
        if gemini_process.poll() is None: # 아직 실행 중이라면
            print("[Gemini CLI 프로세스 종료 요청 중...]")
            gemini_process.stdin.close() # 입력 스트림 닫기
            gemini_process.terminate() # 프로세스 종료 시도
            gemini_process.wait(timeout=5) # 종료 대기
            if gemini_process.poll() is None:
                gemini_process.kill() # 강제 종료
        
        print("[프로그램이 종료되었습니다.]")
        sys.exit(0) # 프로그램 종료

if __name__ == "__main__":
    main()
```


